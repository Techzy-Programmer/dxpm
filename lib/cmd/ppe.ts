// Play-Pause-Eject Command Handling
import { Command } from "../../deps.ts";
import { sendMSG } from "../helper/network.ts";
import { askFromKV } from "../helper/utility.ts";
import { elog, slog, wlog } from "../helper/logs.ts";
import { PlayPauseEjectCmd } from "../helper/ipc.ts";

// #region Commands Initialization

const optTxt = "Id of script corresponding to one provided in the config file.";
const optArg = "-s, --script <Id>";

const playCommand = new Command()
    .description("Re-starts the stopped scripts.").option(optArg, optTxt)
    .action(({ script }) => ppeHandler(script, "play"));

const pauseCommand = new Command()
    .description("Stops the active execution of configured scripts.").option(optArg, optTxt)
    .action(({ script }) => ppeHandler(script, "pause"));

const ejectCommand = new Command()
    .description("Stop and delete the configured script.").option(optArg, optTxt)
    .action(({ script }) => ppeHandler(script, "eject"));

// #endregion

const alt = {
    "play": "start",
    "pause": "stop",
    "eject": "delete",
};

const altPast = {
    "play": "started",
    "pause": "stopped",
    "eject": "deleted",
};

async function ppeHandler(script: string | undefined, type: "play" | "pause" | "eject") {
    if (!script) {
        script = await askFromKV(`Select a script to ${type} (${alt[type]}):`);
        if (!script) return wlog(`No scripts avaliable to ${type} (${alt[type]})!`);
    }

    const ejectCmd: PlayPauseEjectCmd = {
        action: type,
        script
    }

    const key = type === "pause" ? "paused" :
        type === "eject" ? "ejected" : "played";

    const response = await sendMSG<{
        [key: string]: boolean,
        found: boolean
    }>(ejectCmd);

    if (response === "Dead") {
        elog("SocketIO Error, Connection dead");
        return;
    }

    if (!response || !response.found) {
        elog(`Script with id '${script}' not found!`);
        return;
    }

    if (!response[key]) {
        elog(`Unable to ${alt[type]} script. Please try again later.`);
        return;
    }

    slog(`${key}: Script ${altPast[type]} successfully.`);
}

export {
    playCommand,
    pauseCommand,
    ejectCommand
};
