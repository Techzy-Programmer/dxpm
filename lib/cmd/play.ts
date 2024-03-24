import { Command } from "../../deps.ts";
import { elog, slog } from "../helper/logs.ts";
import { sendMSG } from "../helper/network.ts";
import { PlayPauseEjectCmd } from "../helper/ipc.ts";

const playCommand = new Command()
    .description("Re-starts the stopped scripts.")
    .option("-s, --script <Id>", "Id of script corresponding to one provided in the config file.")
    .action(({ script }) => playHandler(script));

async function playHandler(script: string | undefined) {
    if (!script) {
        elog("Please provide script id to perform play operation!");
        return;
    }

    const playCmd: PlayPauseEjectCmd = {
        action: "play",
        script
    }

    const response = await sendMSG<{
        played: boolean,
        found: boolean
    }>(playCmd);

    if (response === "Dead") {
        elog("SocketIO Error, Connection dead");
        return;
    }

    if (!response || !response.found) {
        elog(`Script with id '${script}' not found!`);
        return;
    }

    if (!response.played) {
        elog("Unable to start script. Please try again later.");
        return;
    }

    slog("Script played (started) successfully.");
}

export default playCommand;
