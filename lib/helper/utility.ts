import { SelfKillCmd, IPC_PORT, IPC_HOST } from "./ipc.ts";
import { isPortAvailable } from "../../deps.ts";
import { sendMSG } from "./network.ts";

export function delay(millis: number) {
    return new Promise(resolve =>
        setTimeout(resolve, millis));
}

export async function reloadAndCacheModule(mod: string) {
    const command = new Deno.Command("deno", {
        args: ["cache", "--reload", mod],
        stderr: "null",
        stdout: "null",
        stdin: "null"
    });

    return (await command.spawn().status).success;
}

export async function killDaemon() {
    if (await isPortAvailable({
        port: IPC_PORT,
        hostname: IPC_HOST
    })) return true;

    const killCmd: SelfKillCmd = { action: "kill" };
    const response = await sendMSG<object>(killCmd);

    // `response === "Dead"` means that deamon has exited
    if (response === "Dead") return true;
    console.log(response);
    return false;
}
