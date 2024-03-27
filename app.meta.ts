const getGHRawURL = (branch: string, resource: string) =>
    `https://raw.githubusercontent.com/Techzy-Programmer/dxpm/${branch}${resource}`;
const VERSION = "v0.2.7-us";

export {
    getGHRawURL,
    VERSION
}
