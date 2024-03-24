import { dirname } from "./deps.ts";
import { reloadAndCacheModule } from "./lib/helper/utility.ts";

const installAt = dirname(Deno.execPath());
const dxpmUrl = "https://deno.land/x/dxpm/dxpm.ts";
const daemonUrl = "https://deno.land/x/dxpm/lib/bg/daemon.ts";
const configs = ["-fr", "-A", "--unstable-kv", "-n", "dxpm"];

console.log("Caching required modules...");
await reloadAndCacheModule(daemonUrl);

const installer = new Deno.Command("deno", {
    args: ["install", ...configs, "--root", installAt, dxpmUrl],
}).spawn();

const { success } = await installer.status;
console.log(success ? "\nDXPM 'Deno eXtensible Package Manager' installed successfully!\n"
    : "\nOops! DXPM installation failed, something's quite wrong! Please try again later.\n");
