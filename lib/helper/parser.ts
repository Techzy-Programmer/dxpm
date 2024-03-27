import { ZodError, isAbsolute, jsonc, dirname, Input } from "../../deps.ts";
import { DXPMConfig, DXPMConfigSchema } from "./struct.ts";
import { elog, wlog } from "./logs.ts";
import { exists } from "../../deps.ts";

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
            const ids: string[] = [];

            for (const appConf of configObject.apps) {
                if (!appConf.cwd) appConf.cwd = dirname(filePath);
                
                if (!appConf.cwd.endsWith("/") && appConf.cwd.endsWith("\\")) {
                    appConf.cwd = appConf.cwd + "/";
                }

                if (!isAbsolute(appConf.script)) {
                    try {
                        appConf.script = await Deno
                            .realPath(appConf.cwd + appConf.script);
                    } catch { /* Ignore as it will be handled below */ }
                }

                if (!(await exists(appConf.script))) {
                    elog(`Script file not found at '${appConf.script}', exiting...`);
                    Deno.exit(1);
                }
                
                ids.push(appConf.id);
            }

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
        if (!path) {
            const promptedPath = await Input.prompt("Enter path to the config file: ");
            if (promptedPath) return parseConfig(promptedPath);

            wlog("Config file not provided.");
            Deno.exit(1);
        }

        elog("Config file not found. Exiting...");
        Deno.exit(1);
    }

    return configObject;
}
