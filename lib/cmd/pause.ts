import { Command } from "../../deps.ts";
import { elog, slog } from "../helper/logs.ts";
import { sendMSG } from "../helper/network.ts";
import { PlayPauseEjectCmd } from "../helper/ipc.ts";

const pauseCommand = new Command()
    .description("Stops the active execution of configured scripts.")
    .option("-s, --script <Id>", "Id of script corresponding to one provided in the config file.")
    .action(({ script }) => pauseHandler(script));

async function pauseHandler(script: string | undefined) {
    if (!script) {
        elog("Please provide script id to perform pause operation!");
        return;
    }

    const pauseCmd: PlayPauseEjectCmd = {
        action: "pause",
        script
    }

    const response = await sendMSG<{
        paused: boolean,
        found: boolean
    }>(pauseCmd);

    if (response === "Dead") {
        elog("SocketIO Error, Connection dead");
        return;
    }

    if (!response || !response.found) {
        elog(`Script with id '${script}' not found!`);
        return;
    }

    if (!response.paused) {
        elog("Unable to pause script. Please try again later.");
        return;
    }

    slog("Script paused (stopped) successfully.");
}

export default pauseCommand;
