const getGHRawURL = (branch: string, resource: string) =>
    `https://raw.githubusercontent.com/Techzy-Programmer/dxpm/${branch}${resource}`;
const VERSION = "v0.1.0";

export {
    getGHRawURL,
    VERSION
}
