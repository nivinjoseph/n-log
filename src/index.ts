import "@nivinjoseph/n-ext";
import { ConsoleLogger } from "./console-logger.js";
import { FileLoggerConfig } from "./file-logger-config.js";
import { FileLogger } from "./file-logger.js";
import { LogDateTimeZone } from "./log-date-time-zone.js";
import { LogRecord } from "./log-record.js";
import { LoggerConfig } from "./logger-config.js";
import { Logger } from "./logger.js";
import { SlackLogger, SlackLoggerConfig } from "./slack-logger.js";

/**
 * n-log - A flexible logging library for Node.js applications
 * 
 * Features:
 * - Multiple logger implementations (Console, File, Slack)
 * - Configurable log levels and formatting
 * - JSON and plain text output support
 * - Timezone-aware timestamps
 * - OpenTelemetry trace integration
 * - Extensible through custom log injectors
 * 
 * @packageDocumentation
 */

export
{
    /** Console logger implementation */
    ConsoleLogger,

    /** File logger implementation */
    FileLogger,

    /** File logger configuration interface */
    FileLoggerConfig,

    /** Supported timezones for log timestamps */
    LogDateTimeZone,

    /** Log record interface for JSON formatted logs */
    LogRecord,

    /** Base logger interface */
    Logger,

    /** Base logger configuration interface */
    LoggerConfig,

    /** Slack logger implementation */
    SlackLogger,

    /** Slack logger configuration interface */
    SlackLoggerConfig
};
