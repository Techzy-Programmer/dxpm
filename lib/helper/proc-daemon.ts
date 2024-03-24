import { elog, ilog, slog, wlog } from "./logs.ts";
import { getGHRawURL } from "../../app.meta.ts";
import { getAppDataDir } from "../local-db.ts";
import { exists } from "../../deps.ts";
import { delay } from "./utility.ts";

async function ensureDaemonizer() {
    const daemonizerPath = await getAppDataDir() + "/daemonizer.exe";
    
    try {
        return await Deno.realPath(daemonizerPath);
    } catch (e) {
        if (!(e instanceof Deno.errors.NotFound)) return false;
        wlog("Daemonizer for Windows not found, downloading...");

        if (!await downloadDaemonizer(daemonizerPath)) {
            elog("Failed to download Daemonizer");
            return false;
        }
        
        return await Deno.realPath(daemonizerPath);
    }
}

export async function downloadDaemonizer(toPth: string) {
    try {
        const response = await fetch(getGHRawURL("main", "/bin/daemonizer.exe"));
        
        if (!response.ok) {
            return false;
        }

        const dmnzFile = await Deno.open(toPth, {
            create: true,
            write: true
        });

        try {
            await response.body
                ?.pipeTo(dmnzFile.writable);
        } catch {
            return false;   
        }

        slog("Daemonizer downloaded.");
        return true;
    } catch {
        return null;
    }
}

export async function launchDaemonProc() {
    const daemonPath = "https://deno.land/x/dxpm/lib/bg/daemon.ts";
    ilog("Starting daemon process...");

    if (Deno.build.os === "windows") {
        return await launchOnWindows(daemonPath);
    }
    
    const existed = await exists("deno.json");

    if (!existed) {
        await Deno.writeFile("deno.json", new TextEncoder().encode(JSON.stringify({
            tasks: {
                daemon: `deno run -A --unstable-kv ${daemonPath}`,
                test: "deno test"
            }
        }, null, 4)));
    }

    const daemonProc = new Deno.Command("deno", {
        args: ["task", "daemon"],
        stderr: "null",
        stdout: "null",
        stdin: "null"
    }).spawn();

    await delay(500);
    daemonProc.unref();
    slog("DXPM successfully Daemonized.\n");
    if (!existed) await Deno.remove("deno.json");

    return true;
}

async function launchOnWindows(daemonPath: string) {
    const daemonizerPath = await ensureDaemonizer();
    if (!daemonizerPath) return false;

    const daemonizerProc = new Deno
        .Command(daemonizerPath, {
        args: [daemonPath],
        stderr: "null",
        stdout: "null",
        stdin: "null"
    }).spawn();
    
    slog("DXPM successfully Daemonized.\n");
    daemonizerProc.unref();
    await delay(1_000);
    return true;
}
