import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

test("help and version exit without starting an Agent or creating config", (context) => {
    const configDir = fs.mkdtempSync(path.join(os.tmpdir(), "canvas-agent-cli-test-"));
    context.after(() => fs.rmSync(configDir, { recursive: true, force: true }));
    const run = (flag: string) => execFileSync(process.execPath, ["--import", "tsx", "src/index.ts", flag], {
        cwd: process.cwd(), env: { ...process.env, SUPDANCE_CANVAS_CONFIG_DIR: configDir }, timeout: 5000, encoding: "utf8",
    });
    assert.match(run("--help"), /Usage:[\s\S]*supdance-canvas-agent mcp/);
    assert.match(run("--version"), /^\d+\.\d+\.\d+\s*$/);
    assert.deepEqual(fs.readdirSync(configDir), []);
});
