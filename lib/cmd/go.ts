import { printProcessData } from "../helper/logs.ts";
import { parseConfig } from "../helper/parser.ts";
import { sendMSG } from "../helper/network.ts";
import { ilog, elog } from "../helper/logs.ts";
import { SpawnCmd } from "../helper/ipc.ts";
import { TaskDetail } from "../types.ts";
import { Command } from "../../deps.ts";

const goCommand = new Command()
    .description("Starts all the apps configured in the config file.")
    .option("-c, --config <config-file>", "Path to the config file")
    .action(({ config }) => goHandler(config));

async function goHandler(config: string | undefined) {    
    const configObject = await parseConfig(config);

    const spawnCMD: SpawnCmd = {
        config: configObject,
        action: "spawn",
        cwd: Deno.cwd()
    }

    ilog("Script execution initiated");
    const response = await sendMSG<TaskDetail>(spawnCMD);
    
    if (response === "Dead") {
        elog("SocketIO Error, Connection dead");
        return;
    }

    if (!response) return elog("Unable to retrieve execution status."); 
    printProcessData(response);
}

export default goCommand;
