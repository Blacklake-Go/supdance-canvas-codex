#!/usr/bin/env node
import { startHttpServer } from "./server/http.js";
import { startMcpServer } from "./server/mcp.js";
import { openCanvas } from "./open-canvas.js";
import { VERSION } from "./config.js";

if (["--help", "-h"].includes(process.argv[2] || "")) {
    console.log(`SupDance Canvas Agent ${VERSION}\n\nUsage:\n  supdance-canvas-agent                 Start the local HTTP Agent\n  supdance-canvas-agent open [options]  Open Canvas and start the Agent if needed\n  supdance-canvas-agent mcp             Serve Canvas MCP over stdio\n  supdance-canvas-agent --version       Print the installed version\n  supdance-canvas-agent --help          Show this help`);
} else if (["--version", "-v"].includes(process.argv[2] || "")) console.log(VERSION);
else if (process.argv[2] === "mcp") await startMcpServer();
else if (process.argv[2] === "open") {
    try {
        await openCanvas(process.argv.slice(3));
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
    }
}
else startHttpServer();
