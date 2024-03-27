import { IPC_PORT } from "./ipc.ts";
import { elog } from "./logs.ts";

const encoder = new TextEncoder();

export async function sendMSG<ReceiveType>(msg: object, newConn?: Deno.Conn, kill: boolean = true) {
    const conn = newConn || await Deno.connect({
        hostname: "127.0.0.1",
        port: IPC_PORT
    });

    try {
        await conn.write(encoder.encode(JSON.stringify(msg)));

        if (kill) {
            const response = await read(conn) as ReceiveType;
            conn.close(); return response;
        }
    } catch {
        return "Dead";
    }

    return null;
}

async function read(conn: Deno.Conn) {
    const buf = new Uint8Array(1024 * 32);
    const n = await conn.read(buf);

    if (!n) {
        throw new Error("Daemon process exited unexpectedly!");
    }

    const dataBuff = buf.subarray(0, n);
    const data = new TextDecoder()
        .decode(dataBuff).trim();
    
    if (!data) {
        elog("Got unexpected result from Daemon process!");
        Deno.exit(1);
    }

    try {
        return JSON.parse(data);
    } catch {
        elog("Invalid JSON response from Daemon process!");
        Deno.exit(1);
    }
}
