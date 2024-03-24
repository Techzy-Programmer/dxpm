import { launchDaemonProc } from "../helper/proc-daemon.ts";
import { Command, isPortAvailable } from "../../deps.ts";
import { IPC_HOST, IPC_PORT } from "../helper/ipc.ts";
import { VERSION } from "../../app.meta.ts";
import { elog } from "../helper/logs.ts";
import ejectCommand from "./eject.ts";
import renewCommand from "./renew.ts";
import pauseCommand from "./pause.ts";
import autoCommand from "./auto.ts";
import playCommand from "./play.ts";
import showCommand from "./show.ts";
import spyCommand from "./spy.ts";
import goCommand from "./go.ts";

if (await isPortAvailable({ port: IPC_PORT, hostname: IPC_HOST })) {
    if (!await launchDaemonProc()) {
        elog("Failed to Deamonize DXPM.\n");
        Deno.exit(1);
    }
}

export async function entry(args: string[]): Promise<void> {
    await new Command()
        .noGlobals()
        .name("dxpm")
        .version(VERSION)
        .command("go", goCommand)
        .command("show", showCommand)
        .command("play", playCommand)
        .command("pause", pauseCommand)
        .command("eject", ejectCommand)
        .command("spy", spyCommand)
        .command("auto", autoCommand)
        .command("renew", renewCommand)
        .parse(args);
}