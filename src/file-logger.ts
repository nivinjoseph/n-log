import { given } from "@nivinjoseph/n-defensive";
import { Exception } from "@nivinjoseph/n-exception";
import "@nivinjoseph/n-ext";
import { Duration, Make, Mutex } from "@nivinjoseph/n-util";
import Fs from "node:fs";
import Path from "node:path";
import { BaseLogger } from "./base-logger.js";
import { FileLoggerConfig } from "./file-logger-config.js";
import { LogPrefix } from "./log-prefix.js";
import { LogRecord } from "./log-record.js";
import { DateTime } from "luxon";

/**
 * Logger implementation that writes logs to files.
 * Features:
 * - Logs are written to files named by hour (YYYY-MM-DD-HH.log)
 * - Supports both plain text and JSON formatting
 * - Automatic log file rotation
 * - Configurable log retention period
 * - Thread-safe writing using mutex
 * - Debug logs only written in development environment
 */
export class FileLogger extends BaseLogger
{
    private readonly _mutex = new Mutex();
    private readonly _logDirPath: string;
    private readonly _retentionDays: number;

    private _lastPurgedAt = 0;

    /**
     * Creates a new instance of FileLogger
     * @param config - Configuration for the file logger
     * @param config.logDirPath - Absolute path to the directory where log files will be stored
     * @param config.retentionDays - Number of days to retain log files before automatic deletion
     * @param config.logDateTimeZone - Timezone for log timestamps (default: UTC)
     * @param config.useJsonFormat - Whether to format logs as JSON (default: false)
     */
    public constructor(config: FileLoggerConfig)
    {
        super(config);

        const { logDirPath, retentionDays } = config;

        given(logDirPath, "logDirPath").ensureHasValue().ensureIsString()
            .ensure(t => Path.isAbsolute(t), "must be absolute");

        given(retentionDays, "retentionDays").ensureHasValue().ensureIsNumber().ensure(t => t > 0);
        this._retentionDays = Number.parseInt(retentionDays.toString());

        if (!Fs.existsSync(logDirPath))
            Fs.mkdirSync(logDirPath);

        this._logDirPath = logDirPath;
    }

    /**
     * Logs a debug message to a file.
     * Only writes in development environment.
     * @param debug - The debug message to log
     * @returns A promise that resolves when the log is written
     */
    public async logDebug(debug: string): Promise<void>
    {
        if (this.env === "dev")
            await this._writeToLog(LogPrefix.debug, debug);
    }

    /**
     * Logs an informational message to a file
     * @param info - The informational message to log
     * @returns A promise that resolves when the log is written
     */
    public async logInfo(info: string): Promise<void>
    {
        await this._writeToLog(LogPrefix.info, info);
    }

    /**
     * Logs a warning message or exception to a file
     * @param warning - The warning message or exception to log
     * @returns A promise that resolves when the log is written
     */
    public async logWarning(warning: string | Exception): Promise<void>
    {
        await this._writeToLog(LogPrefix.warning, this.getErrorMessage(warning));
    }

    /**
     * Logs an error message or exception to a file
     * @param error - The error message or exception to log
     * @returns A promise that resolves when the log is written
     */
    public async logError(error: string | Exception): Promise<void>
    {
        await this._writeToLog(LogPrefix.error, this.getErrorMessage(error));
    }

    /**
     * Writes a log message to the appropriate log file
     * @param status - The log level/status
     * @param message - The message to log
     * @returns A promise that resolves when the log is written
     */
    private async _writeToLog(status: LogPrefix, message: string): Promise<void>
    {
        given(status, "status").ensureHasValue().ensureIsEnum(LogPrefix);
        given(message, "message").ensureHasValue().ensureIsString();

        const dateTime = this.getDateTime();

        if (this.useJsonFormat)
        {
            let level = "";

            switch (status)
            {
                case LogPrefix.debug:
                    level = "Debug";
                    break;
                case LogPrefix.info:
                    level = "Info";
                    break;
                case LogPrefix.warning:
                    level = "Warn";
                    break;
                case LogPrefix.error:
                    level = "Error";
                    break;
            }

            let log: LogRecord = {
                source: this.source,
                service: this.service,
                env: this.env,
                level: level,
                message,
                dateTime,
                time: new Date().toISOString()
            };

            this.injectTrace(log, level === "Error");

            if (this.logInjector)
                log = this.logInjector(log);

            message = JSON.stringify(log);
        }
        else
        {
            message = `${dateTime} ${status} ${message}`;
        }

        const logFileName = `${dateTime.substr(0, 13)}.log`;
        const logFilePath = Path.join(this._logDirPath, logFileName);

        await this._mutex.lock();
        try 
        {
            await Fs.promises.appendFile(logFilePath, `\n${message}`);

            await this._purgeLogs();
        }
        catch (error)
        {
            console.error(error);
        }
        finally
        {
            this._mutex.release();
        }
    }

    /**
     * Purges log files older than the retention period
     * @returns A promise that resolves when the purge is complete
     */
    private async _purgeLogs(): Promise<void>
    {
        const now = Date.now();
        if (this._lastPurgedAt && this._lastPurgedAt > (now - Duration.fromDays(this._retentionDays).toMilliSeconds()))
            return;

        const files = await Make.callbackToPromise<ReadonlyArray<string>>(Fs.readdir)(this._logDirPath);
        await files.forEachAsync(async (file) =>
        {
            const filePath = Path.join(this._logDirPath, file);
            const stats = await Make.callbackToPromise<Fs.Stats>(Fs.stat)(filePath);
            if (stats.isFile() && DateTime.fromJSDate(stats.birthtime).valueOf() < (now - Duration.fromDays(this._retentionDays).toMilliSeconds()))
                await Make.callbackToPromise(Fs.unlink)(filePath);
        }, 1);

        this._lastPurgedAt = now;
    }
}