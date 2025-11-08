import { ConfigurationManager } from "@nivinjoseph/n-config";
import { Exception } from "@nivinjoseph/n-exception";
import { SpanStatusCode, context, isSpanContextValid, trace } from "@opentelemetry/api";
import { LogDateTimeZone } from "./log-date-time-zone.js";
import { DateTime } from "luxon";
/**
 * Abstract base class that provides common logging functionality.
 * Implements the Logger interface and provides shared functionality for all logger implementations.
 * Handles common tasks like timestamp formatting, error message extraction, and trace injection.
 */
export class BaseLogger {
    /**
     * Gets the source identifier for logs (default: "nodejs")
     */
    get source() { return this._source; }
    /**
     * Gets the service name for logs (default: package name or "n-log")
     */
    get service() { return this._service; }
    /**
     * Gets the environment identifier for logs (default: "dev")
     */
    get env() { return this._env; }
    /**
     * Gets whether JSON format is enabled for logs
     */
    get useJsonFormat() { return this._useJsonFormat; }
    /**
     * Gets the log record injector function if configured
     */
    get logInjector() { return this._logInjector; }
    /**
     * Creates a new instance of BaseLogger
     * @param config - Optional configuration for the logger
     * @param config.logDateTimeZone - The timezone to use for log timestamps (default: UTC)
     * @param config.useJsonFormat - Whether to format logs as JSON (default: false)
     * @param config.logInjector - Function to inject additional data into log records (only used when useJsonFormat is true)
     * @param config.enableOtelToDatadogTraceConversion - Whether to enable OpenTelemetry to Datadog trace ID conversion
     */
    constructor(config) {
        var _a, _b, _c, _d;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        this._UINT_MAX = 4294967296;
        this._source = "nodejs";
        this._service = (_b = (_a = ConfigurationManager.getConfig("package_name")) !== null && _a !== void 0 ? _a : ConfigurationManager.getConfig("package.name")) !== null && _b !== void 0 ? _b : "n-log";
        this._env = (_d = (_c = ConfigurationManager.getConfig("env")) === null || _c === void 0 ? void 0 : _c.toLowerCase()) !== null && _d !== void 0 ? _d : "dev";
        // eslint-disable-next-line @typescript-eslint/unbound-method
        const { logDateTimeZone, useJsonFormat, logInjector, enableOtelToDatadogTraceConversion } = config !== null && config !== void 0 ? config : {};
        if (!logDateTimeZone || logDateTimeZone.isEmptyOrWhiteSpace() ||
            ![LogDateTimeZone.utc, LogDateTimeZone.local, LogDateTimeZone.est, LogDateTimeZone.pst].contains(logDateTimeZone)) {
            this._logDateTimeZone = LogDateTimeZone.utc;
        }
        else {
            this._logDateTimeZone = logDateTimeZone;
        }
        this._useJsonFormat = !!useJsonFormat;
        this._logInjector = logInjector !== null && logInjector !== void 0 ? logInjector : null;
        this._enableOtelToDatadogTraceConversion = !!enableOtelToDatadogTraceConversion;
    }
    /**
     * Extracts an error message from an exception or error object
     * @param exp - The exception or error to extract the message from
     * @returns The extracted error message
     */
    getErrorMessage(exp) {
        let logMessage = "";
        try {
            if (exp instanceof Exception)
                logMessage = exp.toString();
            else if (exp instanceof Error)
                logMessage = exp.stack;
            else
                logMessage = exp.toString();
        }
        catch (error) {
            console.warn(error);
            logMessage = "There was an error while attempting to log another error. Check earlier logs for a warning.";
        }
        return logMessage;
    }
    /**
     * Gets the current date and time in the configured timezone
     * @returns ISO formatted date-time string
     */
    getDateTime() {
        let result = null;
        switch (this._logDateTimeZone) {
            case LogDateTimeZone.utc:
                result = DateTime.utc().toISO();
                break;
            case LogDateTimeZone.local:
                result = DateTime.now().setZone("local").toISO();
                break;
            case LogDateTimeZone.est:
                result = DateTime.now().setZone("America/New_York").toISO();
                break;
            case LogDateTimeZone.pst:
                result = DateTime.now().setZone("America/Los_Angeles").toISO();
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
    injectTrace(log, isError = false) {
        const span = trace.getSpan(context.active());
        if (span) {
            const spanContext = span.spanContext();
            if (isSpanContextValid(spanContext)) {
                log["trace_id"] = spanContext.traceId;
                log["span_id"] = spanContext.spanId;
                log["trace_flags"] = `0${spanContext.traceFlags.toString(16)}`;
                if (isError)
                    span.setStatus({
                        code: SpanStatusCode.ERROR,
                        message: log.message
                    });
                if (this._enableOtelToDatadogTraceConversion) {
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
    _toNumberString(buffer, radix) {
        let high = this._readInt32(buffer, 0);
        let low = this._readInt32(buffer, 4);
        let str = "";
        radix = radix !== null && radix !== void 0 ? radix : 10;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, no-constant-condition
        while (1) {
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
    _fromString(str, raddix) {
        const buffer = new Uint8Array(8);
        const len = str.length;
        let pos = 0;
        let high = 0;
        let low = 0;
        // eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
        if (str[0] === "-")
            pos++;
        const sign = pos;
        while (pos < len) {
            const chr = parseInt(str[pos++], raddix);
            if (!(chr >= 0))
                break; // NaN
            low = low * raddix + chr;
            high = high * raddix + Math.floor(low / this._UINT_MAX);
            low %= this._UINT_MAX;
        }
        if (sign) {
            high = ~high;
            if (low) {
                low = this._UINT_MAX - low;
            }
            else {
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
    _writeUInt32BE(buffer, value, offset) {
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
    _readInt32(buffer, offset) {
        return (buffer[offset + 0] * 16777216) +
            (buffer[offset + 1] << 16) +
            (buffer[offset + 2] << 8) +
            buffer[offset + 3];
    }
}
//# sourceMappingURL=base-logger.js.map