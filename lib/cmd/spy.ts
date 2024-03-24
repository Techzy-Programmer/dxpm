import { LogData } from '../types.ts';
import { colors } from "../../deps.ts";
import { Command } from "../../deps.ts";
import { IPC_PORT, ReadCmd } from "../helper/ipc.ts";
import { elog, slog, ilog, wlog } from "../helper/logs.ts";

const spyCommand = new Command()
    .description("Read realtime logs from running scripts.")
    .option("-s, --script <Id>", "Id of script corresponding to one provided in the config file.")
    .action(({ script }) => spyHandler(script));

async function spyHandler(script: string | undefined) {
    if (!script) {
        elog("Please provide script id to perform log-watch operation!");
        return;
    }

    const spyCmd: ReadCmd = {
        action: "read",
        script
    }

    ilog("Starting script spy (log-watch)...\n");

    const conn = await Deno.connect({
        hostname: "127.0.0.1",
        port: IPC_PORT
    });

    try {
        await conn.write(new TextEncoder()
            .encode(JSON.stringify(spyCmd)));
        await keepReading(conn);
        conn.close();
    } catch { /* Ignore */ }

    slog("Script spy (log-watch) completed.");
}

async function keepReading(conn: Deno.Conn) {
    while (true) {
        const buf = new Uint8Array(1024);
        const n = await conn.read(buf);

        if (!n) {
            elog("[Internal Error] Daemon Exited!");
            Deno.exit(1);
        }

        const dataBuff = buf.subarray(0, n);
        const data = new TextDecoder()
            .decode(dataBuff).trim();
        
        if (!data) {
            elog("[Internal Error] No Response");
            Deno.exit(1);
        }

        try {
            const logData: LogData = JSON.parse(data);

            if ((logData as unknown as ({ notFound: boolean })).notFound) {
                elog("Script not found or is not running!");
                Deno.exit(1);
            }
            
            const { pid, done, isStdOut, log } = logData;
            const pidTxt = colors.gray(pid.toString());
            
            if (done) {
                wlog(`Process with PID ${pid} exited!\n`);
                continue;
            }

            const typeTxt = isStdOut ? colors.cyan.bold("[STD-OUT]") : colors.red.bold("[STD-ERR]");
            console.log(`${pidTxt} ${typeTxt} ${colors.brightWhite(log)}`);
        } catch {
            elog("[Internal Error] Invalid Response");
            Deno.exit(1);
        }
    }
}

export default spyCommand;
