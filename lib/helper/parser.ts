import { DXPMConfig, DXPMConfigSchema } from "./struct.ts";
import { ZodError, jsonc } from "../../deps.ts";
import { elog } from "./logs.ts";

export async function parseConfig(path: string | undefined): Promise<DXPMConfig> {
    let configObject: DXPMConfig | undefined;

    for (const cnfPath of ["dxpm.json", "dxpm.jsonc"]) {
        try {
            const filePath = path ? path : "./" + cnfPath;
            const configStat = await Deno.stat(filePath);
            if (!configStat.isFile) continue;

            const configTxt = Deno.readTextFileSync(filePath);
            const config = jsonc.parse(configTxt);

            configObject = DXPMConfigSchema.parse(config);
            const ids = configObject.apps.map((conf) => conf.id);
            const idsSet = new Set(ids);

            if (idsSet.size !== ids.length) {
                elog("Duplicate script id in same config file is not allowed. Exiting...");
                Deno.exit(1);
            }

            break; // Stop early if config is found
        } catch (e) {
            if (e instanceof ZodError) {
                elog("Invalid config file found. Exiting...");
                Deno.exit(1);
            }
        }
    }

    if (!configObject) {
        elog("Config file not found. Exiting...");
        Deno.exit(1);
    }

    return configObject;
}
