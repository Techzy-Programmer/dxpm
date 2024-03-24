import { EventEmitter, get, isAbsolute, resolve } from "../../deps.ts";
import { TaskDetail, ProcDetail } from "../types.ts";
import { MonitorProc } from "./monitor.ts";
import { delay } from "../helper/utility.ts";
import { SpawnCmd } from "../helper/ipc.ts";
import { AppConfig } from "../types.ts";
import { MiniDB } from "./mini-db.ts";
import { AppData } from "../types.ts";
import kv from "../local-db.ts";

const pausedState = new Map<string, boolean>();

type BootConfig = {
    autoStart?: boolean;
    restartDelaySec?: number;
    env: Record<string, string>;
    permissions: string[];
    scriptPath: string;
    cwd: string;
}

// #region Utility Functions

async function getAllConfigs() {
    const configIter = kv.list<AppConfig>({ prefix: ["scripts", "main"] });
    const appConfigs: AppConfig[] = [];

    for await (const config of configIter) {
        appConfigs.push(config.value);
    }

    return appConfigs;
}

async function getAppData(id: string, index: number) {
    const appData = await kv.get<AppData>(["scripts",
        "instance", id, index.toString()]);
    
    return appData.value;
}

async function isPIDActive(pid: number) {
    const proc = await get(pid);
    if (!proc) return false;

    return proc
        .command
        .toLowerCase()
        .includes("deno");
}

function buildAppsConfig(conf: SpawnCmd) {
    const appConfigs = conf.config.apps.map((app) => {
        const { script } = app;
        const { cwd } = conf;

        const appConf: AppConfig = {
            ...app, scriptPath: isAbsolute(script) ? script : resolve(cwd, script),
            permissions: app.permissions,
            cluster: app.cluster,
            start: new Date(),
            paused: false,
            env: app.env,
            id: app.id,
            cwd: cwd
        }

        return appConf;
    });

    return appConfigs;
}

async function ensureStopped(prevState: string, pid: number) {
    if (prevState !== "running" || !await isPIDActive(pid)) return true;
    const prevProc = MiniDB.getPID(pid);
    let died = false;

    if (!prevProc) {
        // Directly initiate the kill request
        Deno.kill(pid);
    }
    else {
        MiniDB.removePID(pid);
        prevProc.kill();
    }

    // Wait for the process to die
    for (let i = 0; i < 10; i++) {
        await delay(10); // default wait 10ms
        died = !(await isPIDActive(pid));
        if (died) break;
    }

    return died;
}

async function discardRedundantInstances(id: string, allowedInstances: number, remove: boolean = true) {
    const instances = kv.list<AppData>({
        prefix: ["scripts", "instance", id]
    });

    MiniDB.removeMonitor(id);
    let i = 0;

    for await (const { value } of instances) {
        if (i < allowedInstances) {
            i++; continue;
        }

        if (remove) await kv.delete(["scripts", "instance", id, i.toString()]);
        await ensureStopped(value.status, value.pid);

        if (!remove) {
            value.pid = NaN;
            value.stop = new Date();
            value.status = "stopped";
            await kv.set(["scripts", "instance", id, i.toString()], value);
        }
        
        i++;
    }
}

// #endregion

// #region Worker Functions

export async function processPlayPauseEjectCmd(id: string, action: "pause" | "play" | "eject") {
    const { value } = await kv.get<AppConfig>(["scripts", "main", id]);
    const key = action === "pause" ? "paused" :
        action === "eject" ? "ejected" : "played";
    
    if (!value) return ({
        [key]: false,
        found: false
    });

    switch (action) {
        case "pause": case "play": {
            const pause = action === "pause";
            value.paused = Boolean(pause);
            pausedState.set(id, value.paused);
            await kv.set(["scripts", "main", id], value);
        
            if (pause) await discardRedundantInstances(id, 0, false);
            else await spinUp([value]);
            break;
        }

        case "eject":
            await discardRedundantInstances(id, 0);
            await kv.delete(["scripts", "main", id]);
            pausedState.delete(id);
            break;
    }

    return ({
        [key]: true,
        found: true
    });
}

export async function startSpawn() {
    const configs = await getAllConfigs();
    await spinUp(configs);
}

export async function processSpawnCMD(msg: SpawnCmd) {
    const configs = buildAppsConfig(msg);
    return await spinUp(configs);
}

async function spinUp(configs: AppConfig[]): Promise<TaskDetail> {
    const resp: TaskDetail = [];

    for (const config of configs) {
        if (config.paused) continue;
        pausedState.set(config.id, false);
        
        const { id, cluster, scriptPath, permissions, env, cwd, restartDelaySec, autoStart } = config;
        const startPort = cluster?.startPort || Infinity;
        const iter = cluster?.instances || 1;
        config.start = new Date();
        
        const bootConfig: BootConfig = {
            permissions: permissions || [],
            restartDelaySec,
            env: env || {},
            scriptPath,
            autoStart,
            cwd
        };

        discardRedundantInstances(id, iter).then();
        await kv.set(["scripts", "main", id], config);
        MiniDB.setMonitor(id, new EventEmitter());
        const procDetail: ProcDetail[] = [];

        for (let i = 0; i < iter; i++) {
            let appData = await getAppData(id, i);

            if (!appData) {
                appData = {
                    status: "unseen",
                    port: -1,
                    pid: -1
                }
            }

            appData.port = startPort + i; // Reset the environment variable "PORT"
            const [success, pid] = await bootApp(id, appData, bootConfig, i);

            procDetail.push({
                status: success ? "running" : "errored",
                mode: cluster ? "cluster" : "fork",
                uptime: "0s",
                ok: success,
                pid,
            });
        }
        
        resp.push({
            instances: procDetail,
            script: id
        });
    }

    return resp;
}

async function bootApp(id: string, app: AppData, bootConfig: BootConfig, index = 0, uid = 0): Promise<[boolean, number]> {
    const { permissions, env, scriptPath, cwd, autoStart, restartDelaySec } = bootConfig;
    const key = `${id}-${index}`;
    const { port, pid } = app;

    if (pausedState.get(id) !== false)
        return [false, -1];

    if (!uid) {
        uid = Math.floor(Math.random() * 10000000);
        MiniDB.setRID(key, uid);
    }

    if (MiniDB.getRID(key) !== uid) {
        MiniDB.removeRID(key);
        return [false, -1];
    }

    if (Number.isFinite(port))
        env["PORT"] = port.toString();

    if (!await ensureStopped(app.status, pid))
        return [false, -1];
    
    const bootCmd = new Deno.Command("deno", {
        args: ["run", ...permissions, scriptPath],
        stderr: "piped",
        stdout: "piped",
        stdin: "null",
        env,
        cwd
    });

    const appProc = bootCmd.spawn();
    MiniDB.setPID(appProc.pid, appProc);
    MonitorProc.startReader(id, appProc, true);
    MonitorProc.startReader(id, appProc, false);

    const setOpData: AppData = {
        ...app, pid: appProc.pid,
        status: "running"
    };

    kv.set(["scripts", "instance", id, index.toString()], setOpData).then();

    appProc.status.then(async ({ success }) => {
        if (!MiniDB.getPID(appProc.pid)) return;
        else MiniDB.removePID(appProc.pid);

        if (MiniDB.getRID(key) !== uid) return;

        const setOpData: AppData = {
            ...app, status: autoStart ? "waiting" :
                success ? "stopped" : "errored",
            pid: NaN, stop: new Date()
        };

        if (autoStart) {
            const rebootDelay = (restartDelaySec ?? 1) * 1000;
            kv.set(["scripts", "instance", id, index.toString()], setOpData).then();
            return setTimeout(() => bootApp(id, setOpData, bootConfig, index, uid), rebootDelay);
        }

        await kv.set(["scripts", "instance", id, index.toString()], setOpData).then();
    });

    return [true, appProc.pid];
}

// #endregion
