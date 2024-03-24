import { Command } from "../../deps.ts";

const autoCommand = new Command()
    .description("Sets up the auto startup on system boot for DXPM executable.")
    .action(autoHandler);

function autoHandler() {
    console.log("Not implemented yet!");
}

export default autoCommand;
