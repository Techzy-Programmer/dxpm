import { Cell, RowType, Table, TableType, colors } from "../../deps.ts";
import { TaskDetail, ProcDetail } from "../types.ts";

export function elog(emsg: string): void {
    console.log(colors.brightRed(emsg));
}

export function wlog(wmsg: string): void {
    console.log(colors.brightYellow(wmsg));
}

export function ilog(imsg: string): void {
    console.log(colors.brightCyan(imsg));
}

export function slog(smsg: string): void {
    console.log(colors.brightGreen(smsg));
}

export function log(msg: string): void {
    console.log(msg);    
}

export function printProcessData(tasksDet: TaskDetail) {
    const rows: TableType<RowType> = [];
    const cyan = colors.brightCyan;

    for (const { instances, script } of tasksDet) {
        const scriptCell = new Cell(cyan.bold(script))
            .rowSpan(instances.length);
        const subRow = [];

        for (let i = 0; i < instances.length; i++) {
            const instance = instances[i];

            const row = buildScriptRow(String(i), instance);
            if (i === 0) row.unshift(scriptCell);
            subRow.push(row);
        }

        rows.push(...subRow);
    }

    Table.from(rows)
        .header(["Script", "ID", "PID", "Status", "Mode", "Uptime"]
            .map((text) => colors.bold.brightWhite(text)))
        .align("center").border()
        .render();
}

function buildScriptRow(id: string, params: ProcDetail): RowType {
    const { ok, pid, status, mode, uptime } = params;
    const magenta = colors.brightMagenta;
    const yellow = colors.brightYellow;
    const green = colors.brightGreen;
    const blue = colors.brightBlue;
    const red = colors.brightRed;
    const gray = colors.gray;

    function statusClr() {
        if (ok) return green(status);
        if (status === "stopped") return red(status);
        if (status === "waiting") return yellow.dim(status);
        return red.bgBrightRed(` ${status} `);
    }

    return [
        gray(id),
        yellow(pid.toString()), statusClr(),
        mode === "cluster" ? magenta(mode) : blue(mode),
        status !== "running" ? colors.underline.dim(`${uptime}`) : uptime
    ]
}
