import { Select, dirname, isPortAvailable } from "../../deps.ts";
import { SelfKillCmd, IPC_PORT, IPC_HOST } from "./ipc.ts";
import { sendMSG } from "./network.ts";
import kv from "../local-db.ts";

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

export async function askFromKV(ques: string) {
    const { value: choices } = await kv.get<string[]>(["scripts", "active"]);

    if (!choices || choices.length === 0) {
        return;
    }

    return await Select.prompt({
        options: choices,
        message: ques
    });
}

export async function getLatestVersion(): Promise<string | null> {
    try {
        const url = "https://deno.land/x/dxpm";
        const response = await fetch(url, { redirect: "follow" });
        const versionedUrl = response.url;
        
        if (!versionedUrl.includes("@")) return null;
        return versionedUrl.split("@")[1];
    } catch {
        // Ignore
    }

    return null;
}

export async function installBinary() {
    const dxpmUrl = "https://deno.land/x/dxpm/dxpm.ts";
    const configs = ["-fr", "-A", "--unstable-kv", "-n", "dxpm"];
    const installAt = await Deno.realPath(dirname(Deno.execPath()) + "/..");
    
    const installer = new Deno.Command("deno", {
        args: ["install", ...configs, "--root", installAt, dxpmUrl],
        stderr: "null", stdout: "null", stdin: "null"
    }).spawn();
    
    const { success } = await installer.status;
    return success;
}
