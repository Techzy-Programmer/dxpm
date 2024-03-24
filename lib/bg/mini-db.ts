import { EventEmitter } from "../../deps.ts";
import { LogData } from "../types.ts";

export class MiniDB {
    // rid: Runner Id (Process worker)
    private static ridDB = new Map<string, number>();
    private static pidDB = new Map<number, Deno.ChildProcess>();
    private static monitorDB = new Map<string, EventEmitter<{ log (logData: LogData): void }>>();

    // #region PID Methods

    static setPID(key: number, value: Deno.ChildProcess) {
        // Prevent update operation on the same key
        if (this.pidDB.has(key)) return;
        this.pidDB.set(key, value);
    }

    static getPIDProc(key: number) {
        return this.pidDB.get(key);
    }

    static getAllPIDs() {
        return [...this.pidDB.keys()];
    }

    static removePID(key: number) {
        this.pidDB.delete(key);
    }

    // #endregion

    // #region RID Methods

    static setRID(key: string, value: number) {
        this.ridDB.set(key, value);
    }

    static getRID(key: string) {
        return this.ridDB.get(key);
    }

    static removeRID(key: string) {
        this.ridDB.delete(key);
    }

    // #endregion

    // #region Monitor Methods

    static setMonitor(key: string, value: EventEmitter) {
        this.monitorDB.set(key, value);
    }

    static getMonitor(key: string) {
        return this.monitorDB.get(key);
    }

    static removeMonitor(key: string) {
        this.monitorDB.delete(key);
    }

    // #endregion
}
