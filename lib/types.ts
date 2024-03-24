type Status = "running" | "stopped" | "waiting" | "errored" | "unseen";

export type ProcDetail = {
    pid: number;
    ok: boolean;
    status: Status;
    uptime: string;
    mode: "cluster" | "fork";
};

export type TaskDetail = {
    instances: ProcDetail[]
    script: string;
}[];

export type AppConfig = {
    id: string;
    cwd: string;
    start: Date;
    paused: boolean;
    autoStart?: boolean;
    scriptPath: string;
    permissions?: string[];
    restartDelaySec?: number;
    env?: Record<string, string>;

    cluster?: {
        instances: number;
        startPort: number;
    }
};

export type AppData = {
    status: Status;
    port: number;
    stop?: Date;
    pid: number;
};

export type LogData = {
    isStdOut?: boolean;
    script: string;
    done: boolean;
    pid: number;
    log: string;
}
