import { Exception } from "@nivinjoseph/n-exception";
import { BaseLogger } from "./base-logger.js";
/**
 * Logger implementation that writes logs to the console (stdout).
 * Supports both plain text and JSON formatting.
 * In plain text mode, uses colors to distinguish between different log levels:
 * - Info: Blue
 * - Warning: Yellow
 * - Error: Red
 * Debug logs are only output in development environment.
 */
export declare class ConsoleLogger extends BaseLogger {
    private readonly _stream;
    /**
     * Logs a debug message to the console.
     * Only outputs in development environment.
     * @param debug - The debug message to log
     * @returns A promise that resolves when the log is written
     */
    logDebug(debug: string): Promise<void>;
    /**
     * Logs an informational message to the console in blue.
     * @param info - The informational message to log
     * @returns A promise that resolves when the log is written
     */
    logInfo(info: string): Promise<void>;
    /**
     * Logs a warning message or exception to the console in yellow.
     * @param warning - The warning message or exception to log
     * @returns A promise that resolves when the log is written
     */
    logWarning(warning: string | Exception): Promise<void>;
    /**
     * Logs an error message or exception to the console in red.
     * @param error - The error message or exception to log
     * @returns A promise that resolves when the log is written
     */
    logError(error: string | Exception): Promise<void>;
}
