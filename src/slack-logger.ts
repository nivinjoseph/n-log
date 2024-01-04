import { given } from "@nivinjoseph/n-defensive";
import { Exception } from "@nivinjoseph/n-exception";
import { Disposable, Duration } from "@nivinjoseph/n-util";
import * as Slack from "@slack/bolt";
import { StringIndexed } from "@slack/bolt/dist/types/helpers.js";
import { BaseLogger } from "./base-logger.js";
import { LogRecord } from "./log-record.js";
import { Logger } from "./logger.js";
import { LoggerConfig } from "./logger-config.js";


export type SlackLoggerConfig = Pick<LoggerConfig, "logDateTimeZone" | "logInjector"> & {
    slackBotToken: string;
    slackBotChannel: string;
    slackUserName?: string;
    slackUserImage?: string;
    filter?: ReadonlyArray<"Info" | "Warn" | "Error">;
    logFilter?(record: LogRecord): boolean;
    fallback?: Logger;
};

export class SlackLogger extends BaseLogger implements Disposable
{
    private readonly _includeInfo: boolean;
    private readonly _includeWarn: boolean;
    private readonly _includeError: boolean;
    private readonly _logFilter: (record: LogRecord) => boolean;
    private readonly _fallbackLogger: Logger | null;
    private readonly _app: Slack.App;
    private readonly _channel: string;
    private readonly _userName: string;
    private readonly _userImage: string = ":robot_face:";
    private readonly _userImageIsEmoji: boolean;
    private _messages = new Array<SlackMessage>();
    private readonly _timer: NodeJS.Timeout;
    private _isDisposed = false;
    private _disposePromise: Promise<void> | null = null;


    public constructor(config: SlackLoggerConfig)
    {
        super(config);

        // eslint-disable-next-line @typescript-eslint/unbound-method
        const { slackBotToken, slackBotChannel, slackUserName, slackUserImage, logFilter } = config;

        given(slackBotToken, "slackBotToken").ensureHasValue().ensureIsString();
        this._app = new Slack.App({
            receiver: new DummyReceiver(),
            token: slackBotToken
        });

        given(slackBotChannel, "slackBotChannel").ensureHasValue().ensureIsString();
        this._channel = slackBotChannel;

        given(slackUserName, "slackUserName").ensureIsString();
        if (slackUserName != null && slackUserName.isNotEmptyOrWhiteSpace())
            this._userName = slackUserName;
        else
            this._userName = this.service;

        given(slackUserImage, "slackUserImage").ensureIsString();
        if (slackUserImage != null && slackUserImage.isNotEmptyOrWhiteSpace())
            this._userImage = slackUserImage.trim();

        this._userImageIsEmoji = this._userImage.startsWith(":") && this._userImage.endsWith(":");

        const allFilters = ["Info", "Warn", "Error"];
        const filter = config.filter ?? allFilters;
        given(filter, "filter").ensureIsArray().ensure(t => t.every(u => allFilters.contains(u)));
        this._includeInfo = filter.contains("Info");
        this._includeWarn = filter.contains("Warn");
        this._includeError = filter.contains("Error");

        given(logFilter, "logFilter").ensureIsFunction();

        this._logFilter = logFilter ?? ((_: LogRecord): boolean => true);

        this._fallbackLogger = config.fallback ?? null;

        this._timer = setInterval(() =>
        {
            this._flushMessages()
                .catch(e => this._fallbackLogger?.logError(e).catch(e => console.error(e)) ?? console.error(e));
        }, Duration.fromSeconds(30).toMilliSeconds());
    }


    public async logDebug(debug: string): Promise<void>
    {
        if (this.env === "dev")
        {
            let log: SlackMessage = {
                source: this.source,
                service: this.service,
                env: this.env,
                level: "Debug",
                message: debug,
                dateTime: this.getDateTime(),
                time: new Date().toISOString(),
                color: "#F8F8F8"
            };

            if (this.logInjector)
                log = this.logInjector(log) as SlackMessage;

            this._messages.push(log);
        }
    }

    public async logInfo(info: string): Promise<void>
    {
        if (!this._includeInfo)
            return;

        let log: SlackMessage = {
            source: this.source,
            service: this.service,
            env: this.env,
            level: "Info",
            message: info,
            dateTime: this.getDateTime(),
            time: new Date().toISOString(),
            color: "#259D2F"
        };

        if (!this._logFilter(log))
            return;

        if (this.logInjector)
            log = this.logInjector(log) as SlackMessage;

        this._messages.push(log);
    }

    public async logWarning(warning: string | Exception): Promise<void>
    {
        if (!this._includeWarn)
            return;

        let log: SlackMessage = {
            source: this.source,
            service: this.service,
            env: this.env,
            level: "Warn",
            message: this.getErrorMessage(warning),
            dateTime: this.getDateTime(),
            time: new Date().toISOString(),
            color: "#F1AB2A"
        };

        if (!this._logFilter(log))
            return;

        if (this.logInjector)
            log = this.logInjector(log) as SlackMessage;

        this._messages.push(log);
    }

    public async logError(error: string | Exception): Promise<void>
    {
        if (!this._includeError)
            return;

        let log: SlackMessage = {
            source: this.source,
            service: this.service,
            env: this.env,
            level: "Error",
            message: this.getErrorMessage(error),
            dateTime: this.getDateTime(),
            time: new Date().toISOString(),
            color: "#EF401D"
        };

        if (!this._logFilter(log))
            return;

        if (this.logInjector)
            log = this.logInjector(log) as SlackMessage;

        this._messages.push(log);
    }

    public dispose(): Promise<void>
    {
        if (!this._isDisposed)
        {
            this._isDisposed = true;
            clearInterval(this._timer);
            this._disposePromise = this._flushMessages();
        }

        return this._disposePromise!;
    }

    private async _flushMessages(): Promise<void>
    {
        if (this._messages.isEmpty)
            return;

        const messagesToFlush = this._messages;
        this._messages = new Array<SlackMessage>();

        await this._postMessages(messagesToFlush);
    }

    private async _postMessages(messages: ReadonlyArray<SlackMessage>): Promise<void>
    {
        try 
        {
            await this._app.client.chat.postMessage({
                username: this._userName,
                icon_emoji: this._userImageIsEmoji ? this._userImage : undefined,
                icon_url: !this._userImageIsEmoji ? this._userImage : undefined,
                channel: this._channel,
                text: `${this.service} [${this.env}]`,
                attachments: messages.map(log =>
                {
                    return {
                        color: log.color,
                        blocks: [
                            {
                                type: "section",
                                text: {
                                    type: "plain_text",
                                    text: log.message
                                }
                            },
                            {
                                type: "context",
                                elements: [{
                                    type: "plain_text",
                                    text: log.dateTime
                                }]
                            }
                        ]
                    };
                })
            });
        }
        catch (error)
        {
            if (this._fallbackLogger != null)
            {
                await this._fallbackLogger.logWarning("Error while posting to slack.");
                await this._fallbackLogger.logError(error as any);
                await this._fallbackLogger.logWarning("Original messages below");
                await messages.forEachAsync(async log =>
                {
                    switch (log.level)
                    {
                        case "Debug":
                            await this._fallbackLogger!.logDebug(log.message);
                            break;
                        case "Info":
                            await this._fallbackLogger!.logInfo(log.message);
                            break;
                        case "Warn":
                            await this._fallbackLogger!.logWarning(log.message);
                            break;
                        case "Error":
                            await this._fallbackLogger!.logError(log.message);
                            break;
                        default:
                            await this._fallbackLogger!.logError(log.message);
                    }
                }, 1);
            }
            else
            {
                console.warn("Error while posting to slack.");
                console.error(error as any);
                console.warn("Original messages below");
                messages.forEach(log =>
                {
                    switch (log.level)
                    {
                        case "Debug":
                            console.info(log.message);
                            break;
                        case "Info":
                            console.info(log.message);
                            break;
                        case "Warn":
                            console.warn(log.message);
                            break;
                        case "Error":
                            console.error(log.message);
                            break;
                        default:
                            console.error(log.message);
                    }
                });
            }
        }
    }
}

type SlackMessage = LogRecord & { color: string; };

class DummyReceiver implements Slack.Receiver
{
    // @ts-expect-error: not used atm
    public init(app: App<StringIndexed>): void
    {
        // no-op
    }

    // @ts-expect-error: not used atm
    public start(...args: Array<any>): Promise<unknown>
    {
        return Promise.resolve();
    }

    // @ts-expect-error: not used atm
    public stop(...args: Array<any>): Promise<unknown>
    {
        return Promise.resolve();
    }
}