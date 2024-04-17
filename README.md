# 🦕 DXPM - Deno eXtensible Package Manager

DXPM is a powerful and flexible package manager designed specifically for Deno, the secure runtime for JavaScript and TypeScript. It aims to simplify the process of managing Deno scripts and dependencies, providing a robust set of tools for deployment, monitoring, and maintenance of Deno applications.

## About DXPM

DXPM stands out by offering a comprehensive solution for Deno developers, including features for auto-startup, real-time log monitoring, and easy updates. It leverages Deno's security features and supports inter-process communication (IPC) using TCP, making it a versatile tool for managing Deno applications in production environments.

## File Structure and Usage Notes

The `lib` directory is the heart of DXPM, containing all the necessary TypeScript files for its operation. Here's a brief overview of its structure and the purpose of each component:

- **/lib/bg**: Contains files for managing background processes, including a daemon for handling requests and a simple in-memory database.
  - `daemon.ts`: Initializes a listener for IPC and manages incoming requests.
  - `manage.ts`: Provides utility functions for process management.
  - `mini-db.ts`: Implements a basic in-memory database.
  - `monitor.ts`: Monitors child processes and logs their output.

- **/lib/cmd**: Defines CLI commands for DXPM, making it user-friendly and accessible.
  - `auto.ts`: Sets up auto startup on system boot.
  - `go.ts`: Starts all apps configured in a specified config file.
  - `init.ts`: Entry point for the DXPM CLI.
  - `ppe.ts`: Handles Play-Pause-Eject commands.
  - `renew.ts`: Updates DXPM to the latest version.
  - `show.ts`: Displays the status of managed apps and tasks.
  - `spy.ts`: Reads real-time logs from running scripts.

- **/lib/helper**: Provides helper functions and types for DXPM operations.
  - `ipc.ts`, `logs.ts`, `network.ts`, `parser.ts`, `proc-daemon.ts`, `struct.ts`, `utility.ts`: Offer various utilities from logging to network communication and configuration parsing.

- **/lib/types.ts**: Defines custom types used across DXPM, including process details and application configuration.

- **/deno.json**: Configuration file for Deno tasks like running the daemon or executing tests.

- **/deps.ts**: Manages third-party dependencies, ensuring DXPM remains up-to-date and secure.

## IPC Communication Using TCP

DXPM utilizes TCP for IPC communication, enabling efficient and reliable data exchange between processes. This approach allows DXPM to manage Deno scripts and applications seamlessly, offering capabilities such as real-time logging, process monitoring, and dynamic configuration updates.

## Comparison with PM2

| Feature          | DXPM                                              | PM2                                                      |
|------------------|---------------------------------------------------|----------------------------------------------------------|
| Runtime Support  | Deno                                              | Node.js                                                  |
| Configuration    | JSON/JSONC files                                  | ecosystem.config.js, JSON, or YAML                       |
| IPC Mechanism    | TCP                                               | Unix sockets, TCP                                        |
| Auto-startup     | Supported                                         | Supported                                                |
| Real-time Logs   | Yes                                               | Yes                                                      |
| Update Mechanism | Renew command for self-update                     | pm2 update                                               |
| Security         | Leveraging Deno's security model                  | Depends on Node.js security                              |

## How It Works

DXPM operates by leveraging Deno's secure runtime environment, providing a suite of tools for managing and deploying Deno applications. It uses a daemon process to monitor and manage Deno scripts, supporting auto-restart, logging, and process management. Configuration files in JSON or JSONC format dictate the behavior of scripts, including environment variables, start-up options, and dependency management. DXPM's CLI commands offer an intuitive interface for interacting with the package manager, simplifying the deployment and maintenance of Deno applications.

## Installation
> Make sure you already have [**Deno**](https://deno.com/) installed, run following command to install latest version of DXPM executable

`deno run -r --allow-all --unstable-kv https://deno.land/x/dxpm/installer.ts`

## Available CLI Commands

- `go`     - Starts all the apps configured in the config file.
- `show`   - Shows the status of apps & tasks managed by DXPM.
- `play`   - Re-starts the stopped scripts.
- `pause`  - Stops the active execution of configured scripts.
- `eject`  - Stop and delete the configured script.
- `spy`    - Read realtime logs from running scripts.
- `auto`   - Sets up the auto startup on system boot for DXPM executable.
- `renew`  - Updates the DXPM executable to the latest version.

> Use `dxpm <command> -h` to get detailed info regarding the specified command

## Config Files
Default config file name should follow this naming convention `dxpm.json` or `dxpm.jsonc` and should be present in current working directory or you can use `-c` or `--config` option followed by `path/to/config/file.json(c)` to specify configuarations from other directory.

Config files should adhere to this format

```typescript
{
    apps: {
        id: string;
        autoStart?: boolean;
        restartDelaySec?: number;
        timeout?; number;
        permissions?: string[];
        cwd?: string;
        script: string;
        cluster?: {
            instances: number;
            startPort: number;
        };
        env?: {
            MY_USER_NAME: string;
            MY_SECRET_KEY: string;
            // Add more environment variables as needed
        };
    }[];
}
```

- `script`: The path to the Deno script to be managed.
- `id`: A unique identifier for the application.
- `cwd` (optional): The current working directory for the script.
- `timeout` (optional): The maximum time in milliseconds to wait for the script to start.
- `autoStart` (optional): Whether the script should automatically start on DXPM startup.
- `env` (optional): Environment variables to be passed to the script.
- `cluster` (optional): Configuration for running the script in cluster mode.
- `permissions` (optional): An array of Deno permissions to grant to the script.
- `restartDelaySec` (optional): The delay in seconds before restarting the script after it exits.

**About DXPM Cluster Mode**

Cluster mode in DXPM allows a single Deno application to be run in multiple parallel instances, effectively utilizing multiple CPU cores and improving the application's ability to handle high loads. This mode is particularly useful for networked applications that can benefit from horizontal scaling.

When cluster mode is enabled by specifying the instances and startPort in the application's configuration, DXPM will launch the specified number of instances of the application. Each instance will be assigned a unique port number, incrementing from startPort. This setup requires the application to be designed to work with different port numbers for each instance, typically by listening on the provided port number for incoming network connections.

Please note that cluster mode will set `PORT` as env variable overriding any default config

## Ending Note
DXPM represents a significant step forward in Deno application management, combining ease of use with the robust security and flexibility of Deno's runtime environment.

## Author
Rishabh Kumar
