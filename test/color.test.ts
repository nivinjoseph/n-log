import assert from "node:assert";
import { describe, test } from "node:test";
import { LogDateTimeZone, ConsoleLogger } from "../src/index.js";
// import * as moment from "moment-timezone";



await describe("Color test", async () =>
{
    await test("Test console logger colors", async () =>
    {
        const utcLogger = new ConsoleLogger({ logDateTimeZone: LogDateTimeZone.utc });
    
        
        await utcLogger.logDebug("This is a debug should print in normal color");
        await utcLogger.logWarning("This is a warning should print in yellow");
        await utcLogger.logInfo("This is a info should print in blue");
        await utcLogger.logError("This is a error should print in red");
        console.log("This should print without color, to check if the colors don't bleed");

        assert.ok(true);
    });
});