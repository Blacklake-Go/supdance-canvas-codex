#!/usr/bin/env node
import { startHttpServer } from "./server/http.js";
import { startMcpServer } from "./server/mcp.js";
import { openCanvas } from "./open-canvas.js";

if (process.argv[2] === "mcp") await startMcpServer();
else if (process.argv[2] === "open") {
    try {
        await openCanvas(process.argv.slice(3));
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
    }
}
else startHttpServer();
