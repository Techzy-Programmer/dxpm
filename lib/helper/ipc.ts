import { DXPMConfig } from "./struct.ts";

const IPC_HOST = "0.0.0.0";
const IPC_PORT = 7924;

export type SpawnCmd = {
    cwd: string;
    action: "spawn";
    config: DXPMConfig;
}

export type PlayPauseEjectCmd = {
    action: "pause" | "play" | "eject";
    script: string;
}

export type ReadCmd = {
    action: "read";
    script: string;
}

export type SelfKillCmd = {
    action: "kill";
}

export type IPCMsg =
    SpawnCmd | ReadCmd
    | PlayPauseEjectCmd
    | SelfKillCmd;

export {
    IPC_HOST,
    IPC_PORT
}
