import { dirname } from "./deps.ts";
import { reloadAndCacheModule } from "./lib/helper/utility.ts";

const dxpmUrl = "https://deno.land/x/dxpm/dxpm.ts";
const configs = ["-fr", "-A", "--unstable-kv", "-n", "dxpm"];
const daemonUrl = "https://deno.land/x/dxpm/lib/bg/daemon.ts";
const installAt = await Deno.realPath(dirname(Deno.execPath()) + "/..");

console.log("Caching required modules...");
await reloadAndCacheModule(daemonUrl);

const installer = new Deno.Command("deno", {
    args: ["install", ...configs, "--root", installAt, dxpmUrl],
    stderr: "null", stdout: "null", stdin: "null"
}).spawn();

const { success } = await installer.status;
console.log(success ? "\nDXPM 'Deno eXtensible Package Manager' installed successfully!\n"
    : "\nOops! DXPM installation failed, something's quite wrong! Please try again later.\n");
