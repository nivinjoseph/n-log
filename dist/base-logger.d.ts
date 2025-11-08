import { Exception } from "@nivinjoseph/n-exception";
import { LogRecord } from "./log-record.js";
import { Logger } from "./logger.js";
import { LoggerConfig } from "./logger-config.js";
/**
 * Abstract base class that provides common logging functionality.
 * Implements the Logger interface and provides shared functionality for all logger implementations.
 * Handles common tasks like timestamp formatting, error message extraction, and trace injection.
 */
export declare abstract class BaseLogger implements Logger {
    private readonly _UINT_MAX;
    private readonly _source;
    private readonly _service;
    private readonly _env;
    private readonly _logDateTimeZone;
    private readonly _useJsonFormat;
    private readonly _logInjector;
    private readonly _enableOtelToDatadogTraceConversion;
    /**
     * Gets the source identifier for logs (default: "nodejs")
     */
    protected get source(): string;
    /**
     * Gets the service name for logs (default: package name or "n-log")
     */
    protected get service(): string;
    /**
     * Gets the environment identifier for logs (default: "dev")
     */
    protected get env(): string;
    /**
     * Gets whether JSON format is enabled for logs
     */
    protected get useJsonFormat(): boolean;
    /**
     * Gets the log record injector function if configured
     */
    protected get logInjector(): ((record: LogRecord) => LogRecord) | null;
    /**
     * Creates a new instance of BaseLogger
     * @param config - Optional configuration for the logger
     * @param config.logDateTimeZone - The timezone to use for log timestamps (default: UTC)
     * @param config.useJsonFormat - Whether to format logs as JSON (default: false)
     * @param config.logInjector - Function to inject additional data into log records (only used when useJsonFormat is true)
     * @param config.enableOtelToDatadogTraceConversion - Whether to enable OpenTelemetry to Datadog trace ID conversion
     */
    constructor(config?: LoggerConfig);
    /**
     * Logs a debug message
     * @param debug - The debug message to log
     */
    abstract logDebug(debug: string): Promise<void>;
    /**
     * Logs an informational message
     * @param info - The informational message to log
     */
    abstract logInfo(info: string): Promise<void>;
    /**
     * Logs a warning message or exception
     * @param warning - The warning message or exception to log
     */
    abstract logWarning(warning: string | Exception): Promise<void>;
    /**
     * Logs an error message or exception
     * @param error - The error message or exception to log
     */
    abstract logError(error: string | Exception): Promise<void>;
    /**
     * Extracts an error message from an exception or error object
     * @param exp - The exception or error to extract the message from
     * @returns The extracted error message
     */
    protected getErrorMessage(exp: Exception | Error | any): string;
    /**
     * Gets the current date and time in the configured timezone
     * @returns ISO formatted date-time string
     */
    protected getDateTime(): string;
    /**
     * Injects trace information into a log record
     * @param log - The log record to inject trace information into
     * @param isError - Whether this is an error log (affects span status)
     */
    protected injectTrace(log: LogRecord & Record<string, any>, isError?: boolean): void;
    /**
     * Converts a buffer to a number string with the specified radix
     * @param buffer - The buffer to convert
     * @param radix - The radix to use for conversion (default: 10)
     * @returns The converted number string
     */
    private _toNumberString;
    /**
     * Converts a numerical string to a buffer using the specified radix
     * @param str - The string to convert
     * @param raddix - The radix to use for conversion
     * @returns The converted buffer
     */
    private _fromString;
    /**
     * Writes an unsigned 32-bit integer to a buffer in big-endian format
     * @param buffer - The buffer to write to
     * @param value - The value to write
     * @param offset - The offset in the buffer to write at
     */
    private _writeUInt32BE;
    /**
     * Reads a 32-bit integer from a buffer
     * @param buffer - The buffer to read from
     * @param offset - The offset in the buffer to read from
     * @returns The read integer value
     */
    private _readInt32;
}
