import { installBinary } from "./lib/helper/utility.ts";
import { reloadAndCacheModule } from "./lib/helper/utility.ts";

const daemonUrl = "https://deno.land/x/dxpm/lib/bg/daemon.ts";
console.log("Caching required modules...");
await reloadAndCacheModule(daemonUrl);

const success = await installBinary();
console.log(success ? "\nDXPM 'Deno eXtensible Package Manager' installed successfully!\n"
    : "\nOops! DXPM installation failed, something's quite wrong! Please try again later.\n");
