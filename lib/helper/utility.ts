
export function delay(millis: number) {
    return new Promise(resolve =>
        setTimeout(resolve, millis));
}

export async function reloadAndCacheModule(mod: string) {
    const command = new Deno.Command("deno", {
        args: ["cache", "--reload", mod],
        stderr: "null",
        stdout: "null",
        stdin: "null"
    });

    return (await command.spawn().status).success;
}
