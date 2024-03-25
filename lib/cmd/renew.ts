import { Confirm } from "../../deps.ts";
import { Command } from "../../deps.ts";
import { VERSION } from "../../app.meta.ts";
import { elog, ilog, slog, wlog } from "../helper/logs.ts";
import { getLatestVersion, installBinary, reloadAndCacheModule, killDaemon, delay } from "../helper/utility.ts";

const renewCommand = new Command()
    .description("Updates the DXPM executable to the latest version.")
    .action(renewHandler);

async function renewHandler() {
    ilog("Checking for updates...");
    const newVer = await getLatestVersion();
    const baseUrl = "https://deno.land/x/dxpm";

    if (VERSION === newVer) {
        slog("You are on the latest version.");
        return;
    }

    ilog(`Current version: ${VERSION}`);
    ilog(`New version found: ${newVer}`);

    const update = await Confirm
        .prompt(`Would you like to update?`);

    if (!update) {
        wlog("Update aborted.");
        return;
    }

    ilog("Starting update operation...");
    ilog("Caching modules and it's dependencies...");
    await reloadAndCacheModule(`${baseUrl}/lib/bg/daemon.ts`);

    ilog("Aborting active Daemon instance...");
    await killDaemon(); // Send kill cmd to running instance of Daemon

    ilog("Installing binary...");

    if (!await installBinary()) {
        return elog("(Update Error): Failed to install binary.");
    }

    ilog("Restarting daemon process...");
    await runDXPM(); await delay(2_000);
    ilog("Verifying installation...");

    if (await runDXPM("-V") === newVer) {
        slog("Update complete, You are now on the latest version.");
        return;
    }

    elog("(Update Error): Version Mismatch! Check failed.");
}

async function runDXPM(...progArgs: string[]) {
    const decoder = new TextDecoder();
    let dxpmCmd: Deno.Command;
    progArgs.unshift("dxpm");

    if (Deno.build.os === "windows") {
        dxpmCmd = new Deno.Command("cmd", {
            args: ["/C", ...progArgs],
            stdout: "piped"
        });
    } else {
        dxpmCmd = new Deno.Command("bash", {
            stdout: "piped",
            args: progArgs
        });
    }
    
    const stdOut = await dxpmCmd.spawn().stdout.getReader().read();
    const stdOutText = decoder.decode(stdOut.value).trim();

    return stdOutText;
}

export default renewCommand;
