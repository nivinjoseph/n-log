import assert from "node:assert";
import { describe, test } from "node:test";
import { FileLogger, LogDateTimeZone } from "../src/index.js";


await describe("FileLogger tests", async () =>
{
    await test("Basic tests", async () =>
    {
        const logger = new FileLogger({
            logDirPath: process.cwd(),
            retentionDays: 7,
            logDateTimeZone: LogDateTimeZone.est
        });

        await logger.logInfo("I am an info");

        await logger.logWarning("I am a warning");

        await logger.logError("I am an error");

        assert.ok(true);
    });
});