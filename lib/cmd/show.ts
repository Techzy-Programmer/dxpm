import { AppConfig, AppData, TaskDetail, ProcDetail } from "../types.ts";
import { printProcessData } from "../helper/logs.ts";
import { elog } from "../helper/logs.ts";
import { Command } from "../../deps.ts";
import kv from "../local-db.ts";

const showCommand = new Command()
    .description("Shows the status of apps & tasks managed by DXPM.")
    .option("-s, --script <script-id:string>", "Id of the script corresponding to the one provided in the config file.")
    .action(({ script }) => showHandler(script));

function getRunTime(start: Date, end: Date) {
    const durationMs = Math.abs(end.getTime() - start.getTime());
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    else if (hours > 0) return `${hours}h`;
    else if (minutes > 0) return `${minutes}m`;
    else return `${seconds}s`;
}

async function buildProcDetail(data: AppConfig): Promise<ProcDetail[]> {
    const { id, start, cluster } = data;
    const procs: ProcDetail[] = [];
    const now = new Date();

    const appsData = kv.list<AppData>({
        prefix: ["scripts", "instance", id]
    });

    for await (const { value } of appsData) {
        const { pid, status, stop } = value;

        procs.push({
            pid: pid,
            status: status,
            ok: status === "running",
            mode: cluster ? "cluster" : "fork",
            uptime: getRunTime(start, status === "running" ? now : stop ?? now)
        });
    }

    return procs;
}

async function showHandler(script: string | undefined) {
    if (script) {
        await printSolo(script);
        return;
    }

    const taskDetail: TaskDetail = [];
    const appsConfig = kv.list<AppConfig>({
        prefix: ["scripts", "main"]
    });

    for await (const { value } of appsConfig) {
        taskDetail.push({
            script: value.id,
            instances: await buildProcDetail(value)
        });
    }

    printProcessData(taskDetail);
}

async function printSolo(script: string) {
    const appData = (await kv.get<AppConfig>(
        ["scripts", "main", script])).value;
    
    if (!appData) {
        elog(`Script with id '${script}' not configured!`);
        return;
    }

    printProcessData([
        {
            script: appData.id,
            instances: await buildProcDetail(appData)
        }
    ]);
}

export default showCommand;
