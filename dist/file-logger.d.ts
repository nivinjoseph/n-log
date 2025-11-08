import { Exception } from "@nivinjoseph/n-exception";
import "@nivinjoseph/n-ext";
import { BaseLogger } from "./base-logger.js";
import { FileLoggerConfig } from "./file-logger-config.js";
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
export declare class FileLogger extends BaseLogger {
    private readonly _mutex;
    private readonly _logDirPath;
    private readonly _retentionDays;
    private _lastPurgedAt;
    /**
     * Creates a new instance of FileLogger
     * @param config - Configuration for the file logger
     * @param config.logDirPath - Absolute path to the directory where log files will be stored
     * @param config.retentionDays - Number of days to retain log files before automatic deletion
     * @param config.logDateTimeZone - Timezone for log timestamps (default: UTC)
     * @param config.useJsonFormat - Whether to format logs as JSON (default: false)
     */
    constructor(config: FileLoggerConfig);
    /**
     * Logs a debug message to a file.
     * Only writes in development environment.
     * @param debug - The debug message to log
     * @returns A promise that resolves when the log is written
     */
    logDebug(debug: string): Promise<void>;
    /**
     * Logs an informational message to a file
     * @param info - The informational message to log
     * @returns A promise that resolves when the log is written
     */
    logInfo(info: string): Promise<void>;
    /**
     * Logs a warning message or exception to a file
     * @param warning - The warning message or exception to log
     * @returns A promise that resolves when the log is written
     */
    logWarning(warning: string | Exception): Promise<void>;
    /**
     * Logs an error message or exception to a file
     * @param error - The error message or exception to log
     * @returns A promise that resolves when the log is written
     */
    logError(error: string | Exception): Promise<void>;
    /**
     * Writes a log message to the appropriate log file
     * @param status - The log level/status
     * @param message - The message to log
     * @returns A promise that resolves when the log is written
     */
    private _writeToLog;
    /**
     * Purges log files older than the retention period
     * @returns A promise that resolves when the purge is complete
     */
    private _purgeLogs;
}
