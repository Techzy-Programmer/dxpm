import { MiniDB } from "./mini-db.ts";
import { LogData } from "../types.ts";

export class MonitorProc {
    static async startReader(scriptId: string, proc: Deno.ChildProcess, readStdErr: boolean) {
        const reader = readStdErr ? proc.stderr.getReader() : proc.stdout.getReader();

        while (true) {
            const read = await reader.read();
            const log = new TextDecoder().decode(read.value).trim();
            
            if (read.done) {
                if (readStdErr) break;

                const logData: LogData = {
                    script: scriptId,
                    pid: proc.pid,
                    done: true,
                    log: ""
                };

                await MiniDB.getMonitor(scriptId)?.emit("log", logData);
                break;
            }

            const logData: LogData = {
                isStdOut: !readStdErr,
                script: scriptId,
                pid: proc.pid,
                done: false,
                log
            };

            MiniDB.getMonitor(scriptId)?.emit("log", logData).then();
        }
    }
}
