import { dirs } from "../deps.ts";

const kvDB = await getAppDataDir() + "/kv-db";
const kv = await Deno.openKv(kvDB);
export default kv;

export async function getAppDataDir() {
    const dataDir = dirs("data_local")! + "/dxpm";
    await Deno.mkdir(dataDir, { recursive: true });
    await Deno.mkdir(dataDir + "/logs", { recursive: true });

    return dataDir;
}
