import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

import { VERSION } from "./config.js";
import { logger } from "./utils/logger.js";

const require = createRequire(import.meta.url);
const CODEX_VERSION = String((require("@openai/codex/package.json") as { version: string }).version);

/** 记录本地版本，不查询尚未发布的 SupDance npm 包。 */
export function checkVersions() {
    logger.info("SupDance Canvas Agent version", { version: VERSION });
    logger.info("Bundled Codex version", { version: CODEX_VERSION });
    try {
        logger.info("Local Codex version", { version: execFileSync("codex", ["--version"], { encoding: "utf8", timeout: 5_000 }).trim() });
    } catch {
        logger.warn("Local Codex was not found");
    }
}
