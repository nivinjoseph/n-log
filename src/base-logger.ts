import { ConfigurationManager } from "@nivinjoseph/n-config";
import { Exception } from "@nivinjoseph/n-exception";
import { SpanStatusCode, context, isSpanContextValid, trace } from "@opentelemetry/api";
import { LogDateTimeZone } from "./log-date-time-zone.js";
import { LogRecord } from "./log-record.js";
import { Logger } from "./logger.js";
import { LoggerConfig } from "./logger-config.js";
import { DateTime } from "luxon";


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

    protected get source(): string { return this._source; }
    protected get service(): string { return this._service; }
    protected get env(): string { return this._env; }

    protected get useJsonFormat(): boolean { return this._useJsonFormat; }
    protected get logInjector(): ((record: LogRecord) => LogRecord) | null { return this._logInjector; }


    /**
     * 
     * @param logDateTimeZone Default is LogDateTimeZone.utc
     * @param useJsonFormat Default is false
     * @param logInjector Only valid when useJsonFormat is true
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


    public abstract logDebug(debug: string): Promise<void>;
    public abstract logInfo(info: string): Promise<void>;
    public abstract logWarning(warning: string | Exception): Promise<void>;
    public abstract logError(error: string | Exception): Promise<void>;

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

    // Convert a numerical string to a buffer using the specified radix.
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

    // Write unsigned integer bytes to a buffer.
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

    // Read a buffer to unsigned integer bytes.
    private _readInt32(buffer: Uint8Array, offset: number): number
    {
        return (buffer[offset + 0] * 16777216) +
            (buffer[offset + 1] << 16) +
            (buffer[offset + 2] << 8) +
            buffer[offset + 3];
    }
}