import { LoggerConfig } from "./logger-config.js";
export interface FileLoggerConfig extends LoggerConfig {
    logDirPath: string;
    retentionDays: number;
}
