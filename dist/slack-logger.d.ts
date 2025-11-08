import { Exception } from "@nivinjoseph/n-exception";
import { Disposable } from "@nivinjoseph/n-util";
import { BaseLogger } from "./base-logger.js";
import { LogRecord } from "./log-record.js";
import { Logger } from "./logger.js";
import { LoggerConfig } from "./logger-config.js";
/**
 * Configuration options for the Slack logger
 */
export type SlackLoggerConfig = Pick<LoggerConfig, "logDateTimeZone" | "logInjector"> & {
    /** Slack bot token for authentication */
    slackBotToken: string;
    /** Slack channel to post logs to */
    slackBotChannel: string;
    /** Custom username for the bot (default: service name) */
    slackUserName?: string;
    /** Custom user image for the bot (default: robot_face emoji) */
    slackUserImage?: string;
    /** Filter which log levels to post (default: all) */
    filter?: ReadonlyArray<"Info" | "Warn" | "Error">;
    /** Custom filter function for log records */
    logFilter?(record: LogRecord): boolean;
    /** Fallback logger to use if Slack posting fails */
    fallback?: Logger;
};
/**
 * Logger implementation that posts logs to a Slack channel.
 * Features:
 * - Posts logs as formatted Slack messages with colors
 * - Configurable log level filtering
 * - Customizable bot appearance
 * - Batches messages and sends them every 30 seconds
 * - Fallback logger support for error handling
 * - Debug logs only posted in development environment
 */
export declare class SlackLogger extends BaseLogger implements Disposable {
    private readonly _includeInfo;
    private readonly _includeWarn;
    private readonly _includeError;
    private readonly _logFilter;
    private readonly _fallbackLogger;
    private readonly _slackWebClient;
    private readonly _channel;
    private readonly _userName;
    private readonly _userImage;
    private readonly _userImageIsEmoji;
    private _messages;
    private readonly _timer;
    private _isDisposed;
    private _disposePromise;
    /**
     * Creates a new instance of SlackLogger
     * @param config - Configuration for the Slack logger
     */
    constructor(config: SlackLoggerConfig);
    /**
     * Logs a debug message to Slack.
     * Only posts in development environment.
     * @param debug - The debug message to log
     * @returns A promise that resolves when the log is queued
     */
    logDebug(debug: string): Promise<void>;
    /**
     * Logs an informational message to Slack in green.
     * @param info - The informational message to log
     * @returns A promise that resolves when the log is queued
     */
    logInfo(info: string): Promise<void>;
    /**
     * Logs a warning message or exception to Slack in yellow.
     * @param warning - The warning message or exception to log
     * @returns A promise that resolves when the log is queued
     */
    logWarning(warning: string | Exception): Promise<void>;
    /**
     * Logs an error message or exception to Slack in red.
     * @param error - The error message or exception to log
     * @returns A promise that resolves when the log is queued
     */
    logError(error: string | Exception): Promise<void>;
    /**
     * Disposes the logger, flushing any remaining messages.
     * @returns A promise that resolves when disposal is complete
     */
    dispose(): Promise<void>;
    /**
     * Flushes queued messages to Slack
     * @returns A promise that resolves when messages are flushed
     */
    private _flushMessages;
    /**
     * Posts messages to Slack
     * @param messages - The messages to post
     * @returns A promise that resolves when messages are posted
     */
    private _postMessages;
}
