import { ConfigurationManager } from "@nivinjoseph/n-config";
import { Exception } from "@nivinjoseph/n-exception";
import { SpanStatusCode, context, isSpanContextValid, trace } from "@opentelemetry/api";
import { LogDateTimeZone } from "./log-date-time-zone.js";
import { LogRecord } from "./log-record.js";
import { Logger } from "./logger.js";
import { LoggerConfig } from "./logger-config.js";
import { DateTime } from "luxon";

/**
 * Abstract base class that provides common logging functionality.
 * Implements the Logger interface and provides shared functionality for all logger implementations.
 * Handles common tasks like timestamp formatting, error message extraction, and trace injection.
 */
export abstract class BaseLogger implements Logger
{
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private readonly _UINT_MAX = 4294967296;
    private readonly _source = "nodejs";
    private readonly _service = ConfigurationManager.getConfig<string | null>("package_name") ?? ConfigurationManager.getConfig<string | null>("package.name") ?? "n-log";
    private readonly _env = ConfigurationManager.getConfig<string | null>("env")?.toLowerCase() ?? "dev";
    private readonly _logDateTimeZone: LogDateTimeZone;
    private readonly _useJsonFormat: boolean;
    private readonly _logInjector: ((record: LogRecord) => LogRecord) | null;
    private readonly _enableOtelToDatadogTraceConversion: boolean;

    /**
     * Gets the source identifier for logs (default: "nodejs")
     */
    protected get source(): string { return this._source; }

    /**
     * Gets the service name for logs (default: package name or "n-log")
     */
    protected get service(): string { return this._service; }

    /**
     * Gets the environment identifier for logs (default: "dev")
     */
    protected get env(): string { return this._env; }

    /**
     * Gets whether JSON format is enabled for logs
     */
    protected get useJsonFormat(): boolean { return this._useJsonFormat; }

    /**
     * Gets the log record injector function if configured
     */
    protected get logInjector(): ((record: LogRecord) => LogRecord) | null { return this._logInjector; }


    /**
     * Creates a new instance of BaseLogger
     * @param config - Optional configuration for the logger
     * @param config.logDateTimeZone - The timezone to use for log timestamps (default: UTC)
     * @param config.useJsonFormat - Whether to format logs as JSON (default: false)
     * @param config.logInjector - Function to inject additional data into log records (only used when useJsonFormat is true)
     * @param config.enableOtelToDatadogTraceConversion - Whether to enable OpenTelemetry to Datadog trace ID conversion
     */
    public constructor(config?: LoggerConfig)
    {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        const { logDateTimeZone, useJsonFormat, logInjector, enableOtelToDatadogTraceConversion } = config ?? {};

        if (!logDateTimeZone || logDateTimeZone.isEmptyOrWhiteSpace() ||
            ![LogDateTimeZone.utc, LogDateTimeZone.local, LogDateTimeZone.est, LogDateTimeZone.pst].contains(logDateTimeZone))
        {
            this._logDateTimeZone = LogDateTimeZone.utc;
        }
        else
        {
            this._logDateTimeZone = logDateTimeZone;
        }

        this._useJsonFormat = !!useJsonFormat;
        this._logInjector = logInjector ?? null;

        this._enableOtelToDatadogTraceConversion = !!enableOtelToDatadogTraceConversion;
    }

    /**
     * Logs a debug message
     * @param debug - The debug message to log
     */
    public abstract logDebug(debug: string): Promise<void>;

    /**
     * Logs an informational message
     * @param info - The informational message to log
     */
    public abstract logInfo(info: string): Promise<void>;

    /**
     * Logs a warning message or exception
     * @param warning - The warning message or exception to log
     */
    public abstract logWarning(warning: string | Exception): Promise<void>;

    /**
     * Logs an error message or exception
     * @param error - The error message or exception to log
     */
    public abstract logError(error: string | Exception): Promise<void>;

    /**
     * Extracts an error message from an exception or error object
     * @param exp - The exception or error to extract the message from
     * @returns The extracted error message
     */
    protected getErrorMessage(exp: Exception | Error | any): string
    {
        let logMessage = "";
        try 
        {
            if (exp instanceof Exception)
                logMessage = exp.toString();
            else if (exp instanceof Error)
                logMessage = exp.stack!;
            else
                logMessage = (<object>exp).toString();
        }
        catch (error)
        {
            console.warn(error);
            logMessage = "There was an error while attempting to log another error. Check earlier logs for a warning.";
        }

        return logMessage;
    }

    /**
     * Gets the current date and time in the configured timezone
     * @returns ISO formatted date-time string
     */
    protected getDateTime(): string
    {
        let result: string | null = null;

        switch (this._logDateTimeZone)
        {
            case LogDateTimeZone.utc:
                result = DateTime.utc().toISO();
                break;
            case LogDateTimeZone.local:
                result = DateTime.now().setZone("local").toISO()!;
                break;
            case LogDateTimeZone.est:
                result = DateTime.now().setZone("America/New_York").toISO()!;
                break;
            case LogDateTimeZone.pst:
                result = DateTime.now().setZone("America/Los_Angeles").toISO()!;
                break;
            default:
                result = DateTime.utc().toISO();
                break;
        }

        return result;
    }

    /**
     * Injects trace information into a log record
     * @param log - The log record to inject trace information into
     * @param isError - Whether this is an error log (affects span status)
     */
    protected injectTrace(log: LogRecord & Record<string, any>, isError = false): void
    {
        const span = trace.getSpan(context.active());

        if (span)
        {
            const spanContext = span.spanContext();

            if (isSpanContextValid(spanContext))
            {
                log["trace_id"] = spanContext.traceId;
                log["span_id"] = spanContext.spanId;
                log["trace_flags"] = `0${spanContext.traceFlags.toString(16)}`;

                if (isError)
                    span.setStatus({
                        code: SpanStatusCode.ERROR,
                        message: log.message
                    });

                if (this._enableOtelToDatadogTraceConversion)
                {
                    const traceIdEnd = spanContext.traceId.slice(spanContext.traceId.length / 2);
                    log["dd.trace_id"] = this._toNumberString(this._fromString(traceIdEnd, 16));
                    log["dd.span_id"] = this._toNumberString(this._fromString(spanContext.spanId, 16));
                }
            }
        }
    }

    /**
     * Converts a buffer to a number string with the specified radix
     * @param buffer - The buffer to convert
     * @param radix - The radix to use for conversion (default: 10)
     * @returns The converted number string
     */
    private _toNumberString(buffer: Uint8Array, radix?: number): string
    {
        let high = this._readInt32(buffer, 0);
        let low = this._readInt32(buffer, 4);
        let str = "";

        radix = radix ?? 10;

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, no-constant-condition
        while (1)
        {
            const mod = (high % radix) * this._UINT_MAX + low;

            high = Math.floor(high / radix);
            low = Math.floor(mod / radix);
            str = (mod % radix).toString(radix) + str;

            if (!high && !low)
                break;
        }

        return str;
    }

    /**
     * Converts a numerical string to a buffer using the specified radix
     * @param str - The string to convert
     * @param raddix - The radix to use for conversion
     * @returns The converted buffer
     */
    private _fromString(str: string, raddix: number): Uint8Array
    {
        const buffer = new Uint8Array(8);
        const len = str.length;

        let pos = 0;
        let high = 0;
        let low = 0;

        // eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
        if (str[0] === "-")
            pos++;

        const sign = pos;

        while (pos < len)
        {
            const chr = parseInt(str[pos++], raddix);

            if (!(chr >= 0))
                break; // NaN

            low = low * raddix + chr;
            high = high * raddix + Math.floor(low / this._UINT_MAX);
            low %= this._UINT_MAX;
        }

        if (sign)
        {
            high = ~high;

            if (low)
            {
                low = this._UINT_MAX - low;
            }
            else
            {
                high++;
            }
        }

        this._writeUInt32BE(buffer, high, 0);
        this._writeUInt32BE(buffer, low, 4);

        return buffer;
    }

    /**
     * Writes an unsigned 32-bit integer to a buffer in big-endian format
     * @param buffer - The buffer to write to
     * @param value - The value to write
     * @param offset - The offset in the buffer to write at
     */
    private _writeUInt32BE(buffer: Uint8Array, value: number, offset: number): void
    {
        buffer[3 + offset] = value & 255;
        value = value >> 8;
        buffer[2 + offset] = value & 255;
        value = value >> 8;
        buffer[1 + offset] = value & 255;
        value = value >> 8;
        buffer[0 + offset] = value & 255;
    }

    /**
     * Reads a 32-bit integer from a buffer
     * @param buffer - The buffer to read from
     * @param offset - The offset in the buffer to read from
     * @returns The read integer value
     */
    private _readInt32(buffer: Uint8Array, offset: number): number
    {
        return (buffer[offset + 0] * 16777216) +
            (buffer[offset + 1] << 16) +
            (buffer[offset + 2] << 8) +
            buffer[offset + 3];
    }
}