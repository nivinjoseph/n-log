import { Exception } from "@nivinjoseph/n-exception";
import { BaseLogger } from "./base-logger.js";
import { LogPrefix } from "./log-prefix.js";
import { LogRecord } from "./log-record.js";
import chalk from "chalk";

/**
 * Logger implementation that writes logs to the console (stdout).
 * Supports both plain text and JSON formatting.
 * In plain text mode, uses colors to distinguish between different log levels:
 * - Info: Blue
 * - Warning: Yellow
 * - Error: Red
 * Debug logs are only output in development environment.
 */
export class ConsoleLogger extends BaseLogger
{
    private readonly _stream = process.stdout;

    /**
     * Logs a debug message to the console.
     * Only outputs in development environment.
     * @param debug - The debug message to log
     * @returns A promise that resolves when the log is written
     */
    public logDebug(debug: string): Promise<void>
    {
        if (this.env === "dev")
        {
            if (this.useJsonFormat)
            {
                let log: LogRecord = {
                    source: this.source,
                    service: this.service,
                    env: this.env,
                    level: "Debug",
                    message: debug,
                    dateTime: this.getDateTime(),
                    time: new Date().toISOString()
                };

                this.injectTrace(log);

                if (this.logInjector)
                    log = this.logInjector(log);

                this._stream.write(JSON.stringify(log) + "\n");
            }
            else
            {
                this._stream.write(`${this.getDateTime()} ${LogPrefix.debug} ${debug}\n`);
            }
        }

        return Promise.resolve();
    }

    /**
     * Logs an informational message to the console in blue.
     * @param info - The informational message to log
     * @returns A promise that resolves when the log is written
     */
    public logInfo(info: string): Promise<void>
    {
        if (this.useJsonFormat)
        {
            let log: LogRecord = {
                source: this.source,
                service: this.service,
                env: this.env,
                level: "Info",
                message: info,
                dateTime: this.getDateTime(),
                time: new Date().toISOString()
            };

            this.injectTrace(log);

            if (this.logInjector)
                log = this.logInjector(log);

            this._stream.write(JSON.stringify(log) + "\n");
        }
        else
        {
            this._stream.write(chalk.blue(`${this.getDateTime()} ${chalk.bold(LogPrefix.info)} ${info}\n`));
        }

        return Promise.resolve();
    }

    /**
     * Logs a warning message or exception to the console in yellow.
     * @param warning - The warning message or exception to log
     * @returns A promise that resolves when the log is written
     */
    public logWarning(warning: string | Exception): Promise<void>
    {
        if (this.useJsonFormat)
        {
            let log: LogRecord = {
                source: this.source,
                service: this.service,
                env: this.env,
                level: "Warn",
                message: this.getErrorMessage(warning),
                dateTime: this.getDateTime(),
                time: new Date().toISOString()
            };

            this.injectTrace(log);

            if (this.logInjector)
                log = this.logInjector(log);

            this._stream.write(JSON.stringify(log) + "\n");
        }
        else
        {
            this._stream.write(chalk.yellow(`${this.getDateTime()} ${chalk.bold(LogPrefix.warning)} ${this.getErrorMessage(warning)}\n`));
        }

        return Promise.resolve();
    }

    /**
     * Logs an error message or exception to the console in red.
     * @param error - The error message or exception to log
     * @returns A promise that resolves when the log is written
     */
    public logError(error: string | Exception): Promise<void>
    {
        if (this.useJsonFormat)
        {
            let log: LogRecord = {
                source: this.source,
                service: this.service,
                env: this.env,
                level: "Error",
                message: this.getErrorMessage(error),
                dateTime: this.getDateTime(),
                time: new Date().toISOString()
            };

            this.injectTrace(log, true);

            if (this.logInjector)
                log = this.logInjector(log);

            this._stream.write(JSON.stringify(log) + "\n");
        }
        else
        {
            this._stream.write(chalk.red(`${this.getDateTime()} ${chalk.bold(LogPrefix.error)} ${this.getErrorMessage(error)}\n`));
        }

        return Promise.resolve();
    }
}