import { Exception } from "@nivinjoseph/n-exception";
import { BaseLogger } from "./base-logger.js";
export declare class ConsoleLogger extends BaseLogger {
    private readonly _stream;
    logDebug(debug: string): Promise<void>;
    logInfo(info: string): Promise<void>;
    logWarning(warning: string | Exception): Promise<void>;
    logError(error: string | Exception): Promise<void>;
}
