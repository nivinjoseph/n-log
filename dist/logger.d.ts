import { Exception } from "@nivinjoseph/n-exception";
/**
 * Interface defining the contract for logging functionality.
 * Implementations of this interface provide different ways to log messages
 * at various severity levels.
 */
export interface Logger {
    /**
     * Logs a debug message.
     * Only outputs in development environment.
     * @param debug - The debug message to log
     * @returns A promise that resolves when the log operation is complete
     */
    logDebug(debug: string): Promise<void>;
    /**
     * Logs an informational message.
     * @param info - The informational message to log
     * @returns A promise that resolves when the log operation is complete
     */
    logInfo(info: string): Promise<void>;
    /**
     * Logs a warning message or exception.
     * @param warning - The warning message or exception to log
     * @returns A promise that resolves when the log operation is complete
     */
    logWarning(warning: string | Exception): Promise<void>;
    /**
     * Logs an error message or exception.
     * @param error - The error message or exception to log
     * @returns A promise that resolves when the log operation is complete
     */
    logError(error: string | Exception): Promise<void>;
}
