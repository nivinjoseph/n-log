import { ConfigurationManager } from "@nivinjoseph/n-config";
import assert from "node:assert";
import { describe, test } from "node:test";
import { LogDateTimeZone, SlackLogger } from "../src/index.js";


function doSomethingStupid(): void
{
    const s = 1 as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    console.log(s.trim());
}

await describe("SlackLogger tests", async () =>
{
    await test("Basic tests", async () =>
    {
        const logger = new SlackLogger({
            slackBotToken: ConfigurationManager.getConfig("slackBotToken"),
            slackBotChannel: ConfigurationManager.getConfig("slackBotChannel"),
            slackUserName: "n-log test",
            // slackUserImage: "https://www.advancedaircharters.com/static/959dd2cfbff77d3dd8ee907b539f8d1b/1035a/footer-logo.png",
            logDateTimeZone: LogDateTimeZone.est
        });

        await logger.logDebug("Hello world");

        await logger.logInfo("I am an info");

        await logger.logWarning("I am a warning");

        await logger.logError("I am an error");

        try 
        {
            doSomethingStupid();
        }
        catch (error)
        {
            await logger.logError(error as any);
        }

        await logger.dispose();

        assert.ok(true);
    });
});