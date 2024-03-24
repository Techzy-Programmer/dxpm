import { Command } from "../../deps.ts";

/**
 * [Steps]
 * Cache dxpm.ts from deno.land/x/dxpm
 * Cache daemon.ts from deno.land/x/dxpm
 * Send kill cmd to running instance of daemon.ts
 * Run `deno install` with required flags and args
*/

const renewCommand = new Command()
    .description("Updates the DXPM executable to the latest version.")
    .action(renewHandler);

function renewHandler() {
    console.log("Not implemented yet!");
}

export default renewCommand;
