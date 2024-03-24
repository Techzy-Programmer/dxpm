import { Command } from "../../deps.ts";

const renewCommand = new Command()
    .description("Updates the DXPM executable to the latest version.")
    .action(renewHandler);

function renewHandler() {
    console.log("Not implemented yet!");
}

export default renewCommand;
