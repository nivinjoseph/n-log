import { Exception } from "@nivinjoseph/n-exception";
import { LogRecord } from "./log-record.js";
import { Logger } from "./logger.js";
import { LoggerConfig } from "./logger-config.js";
export declare abstract class BaseLogger implements Logger {
    private readonly _UINT_MAX;
    private readonly _source;
    private readonly _service;
    private readonly _env;
    private readonly _logDateTimeZone;
    private readonly _useJsonFormat;
    private readonly _logInjector;
    private readonly _enableOtelToDatadogTraceConversion;
    protected get source(): string;
    protected get service(): string;
    protected get env(): string;
    protected get useJsonFormat(): boolean;
    protected get logInjector(): ((record: LogRecord) => LogRecord) | null;
    /**
     *
     * @param logDateTimeZone Default is LogDateTimeZone.utc
     * @param useJsonFormat Default is false
     * @param logInjector Only valid when useJsonFormat is true
     */
    constructor(config?: LoggerConfig);
    abstract logDebug(debug: string): Promise<void>;
    abstract logInfo(info: string): Promise<void>;
    abstract logWarning(warning: string | Exception): Promise<void>;
    abstract logError(error: string | Exception): Promise<void>;
    protected getErrorMessage(exp: Exception | Error | any): string;
    protected getDateTime(): string;
    protected injectTrace(log: LogRecord & Record<string, any>, isError?: boolean): void;
    private _toNumberString;
    private _fromString;
    private _writeUInt32BE;
    private _readInt32;
}
