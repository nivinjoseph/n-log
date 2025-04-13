import { LoggerConfig } from "./logger-config.js";

/**
 * Configuration interface for file loggers
 */
export interface FileLoggerConfig extends LoggerConfig
{
    /**
     * Absolute path to the directory where log files will be stored
     */
    logDirPath: string;

    /**
     * Number of days to retain log files before automatic deletion
     * Must be greater than 0
     */
    retentionDays: number;
}