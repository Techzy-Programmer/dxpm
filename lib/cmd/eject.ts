import { Command } from "../../deps.ts";
import { elog, slog } from "../helper/logs.ts";
import { sendMSG } from "../helper/network.ts";
import { PlayPauseEjectCmd } from "../helper/ipc.ts";

const ejectCommand = new Command()
    .description("Stop and delete the configured script.")
    .option("-s, --script <Id>", "Id of script corresponding to one provided in the config file.")
    .action(({ script }) => ejectHandler(script));

async function ejectHandler(script: string | undefined) {
    if (!script) {
        elog("Please provide script id to perform eject operation!");
        return;
    }

    const ejectCmd: PlayPauseEjectCmd = {
        action: "eject",
        script
    }

    const response = await sendMSG<{
        ejected: boolean,
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

    if (!response.ejected) {
        elog("Unable to remove script. Please try again later.");
        return;
    }

    slog("Script ejected (deleted) successfully.");
}

export default ejectCommand;
