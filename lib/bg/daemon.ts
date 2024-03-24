import { abort } from "./manage.ts";
import { LogData } from "../types.ts";
import { MiniDB } from "./mini-db.ts";
import { sendMSG } from "../helper/network.ts";
import { getAppDataDir } from "../local-db.ts";
import { IPC_PORT, IPC_HOST, IPCMsg } from "../helper/ipc.ts";
import { startSpawn, processSpawnCMD, processPlayPauseEjectCmd } from "./manage.ts";

console.log("Hello from Daemon!");
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const listner = Deno.listen({
    hostname: IPC_HOST,
    port: IPC_PORT
});

// Try to start scripts stored in KV
startSpawn().then();

for await (const con of listner) {
    handleRequest(con).then()
        .catch(e => console.error(e));
}

export async function handleRequest(conn: Deno.Conn) {
    while (true) {
        const buf = new Uint8Array(1024);
        const n = await conn.read(buf);
    
        if (!n) {
            conn.close();
            return;
        }
    
        const dataBuff = buf.subarray(0, n);
        const data = decoder.decode(dataBuff).trim();
        if (!data) continue;

        try {
            handleMSG(JSON.parse(data), conn)
                .catch(e => console.error(e));
        } catch (e) {
            console.error(e);
        }
    }
}

async function handleMSG(msg: IPCMsg, conn: Deno.Conn) {
    let resp: unknown = {
        error: true
    };

    try {
        switch (msg.action) {
            case "spawn": {
                resp = await processSpawnCMD(msg);
                break;
            }

            case "pause": case "play": case "eject": {
                resp = await processPlayPauseEjectCmd(msg.script, msg.action);
                break;
            }

            case "read": {
                const logMonitor = MiniDB.getMonitor(msg.script);

                if (!logMonitor) {
                    resp = { notFound: true }
                    break;
                }

                const listner = (logData: LogData) => {
                    sendMSG(logData, conn, false).then((r) => {
                        if (r === "Dead") logMonitor.off("log", listner);
                    });
                }

                logMonitor.on("log", listner);
                return; // Don't send response directly
            }

            case "kill": {
                abort(); // Code Red
                Deno.exit(0);
            }
        }
    } catch (e) {
        await writeLogsToFile("Error in `handleMSG()` function", e);
    }

    try {
        await conn.write(encoder
            .encode(JSON.stringify(resp)));
    } catch { /* Ignore */ }
}

export async function writeLogsToFile(...logs: unknown[]) {
    const dataDir = await getAppDataDir();
    const file = dataDir + "/logs/" + new Date()
        .toDateString().replaceAll(" ", "-") + ".log";
    const log = `\n---------\n${logs.join("\n")}\n---------\n`;
    await Deno.writeTextFile(file, log, { append: true });
}
