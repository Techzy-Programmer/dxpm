import { playCommand, pauseCommand, ejectCommand } from "./ppe.ts";
import { launchDaemonProc } from "../helper/proc-daemon.ts";
import { Command, isPortAvailable } from "../../deps.ts";
import { IPC_HOST, IPC_PORT } from "../helper/ipc.ts";
import { VERSION } from "../../app.meta.ts";
import { elog } from "../helper/logs.ts";
import renewCommand from "./renew.ts";
import autoCommand from "./auto.ts";
import showCommand from "./show.ts";
import spyCommand from "./spy.ts";
import goCommand from "./go.ts";

if (await isPortAvailable({ port: IPC_PORT, hostname: IPC_HOST })) {
    if (!await launchDaemonProc()) {
        elog("Failed to Deamonize DXPM.\n");
        Deno.exit(1);
    }
}

let entryCmd: unknown;

export async function entry(args: string[]): Promise<void> {
    entryCmd = new Command()
        .noGlobals()
        .name("dxpm")
        .version(VERSION)
        .action(() => entryHandler())
        .description("DXPM (Deno eXtensible Package Manager) CLI")

        .command("go", goCommand)
        .command("show", showCommand)
        
        .command("play", playCommand)
        .command("pause", pauseCommand)
        .command("eject", ejectCommand)
        
        .command("spy", spyCommand)
        .command("auto", autoCommand)
        .command("renew", renewCommand);
    
    await (entryCmd as Command).parse(args);
}

function entryHandler() {
    (entryCmd as Command).showHelp();
}
