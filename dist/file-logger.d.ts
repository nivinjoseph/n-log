import { Exception } from "@nivinjoseph/n-exception";
import "@nivinjoseph/n-ext";
import { BaseLogger } from "./base-logger.js";
import { FileLoggerConfig } from "./file-logger-config.js";
export declare class FileLogger extends BaseLogger {
    private readonly _mutex;
    private readonly _logDirPath;
    private readonly _retentionDays;
    private _lastPurgedAt;
    /**
     *
     * @param logDateTimeZone Default is LogDateTimeZone.utc
     * @param useJsonFormat Default is false
     */
    constructor(config: FileLoggerConfig);
    logDebug(debug: string): Promise<void>;
    logInfo(info: string): Promise<void>;
    logWarning(warning: string | Exception): Promise<void>;
    logError(error: string | Exception): Promise<void>;
    private _writeToLog;
    private _purgeLogs;
}
