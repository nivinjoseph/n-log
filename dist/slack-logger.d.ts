import { Exception } from "@nivinjoseph/n-exception";
import { Disposable } from "@nivinjoseph/n-util";
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
export declare class SlackLogger extends BaseLogger implements Disposable {
    private readonly _includeInfo;
    private readonly _includeWarn;
    private readonly _includeError;
    private readonly _logFilter;
    private readonly _fallbackLogger;
    private readonly _app;
    private readonly _channel;
    private readonly _userName;
    private readonly _userImage;
    private readonly _userImageIsEmoji;
    private _messages;
    private readonly _timer;
    private _isDisposed;
    private _disposePromise;
    constructor(config: SlackLoggerConfig);
    logDebug(debug: string): Promise<void>;
    logInfo(info: string): Promise<void>;
    logWarning(warning: string | Exception): Promise<void>;
    logError(error: string | Exception): Promise<void>;
    dispose(): Promise<void>;
    private _flushMessages;
    private _postMessages;
}
