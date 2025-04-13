import { LogDateTimeZone } from "./log-date-time-zone.js";
import { LogRecord } from "./log-record.js";

/**
 * Base configuration interface for loggers
 */
export interface LoggerConfig
{
    /**
     * Timezone to use for log timestamps
     * @default LogDateTimeZone.utc
     */
    logDateTimeZone?: LogDateTimeZone;

    /**
     * Whether to format logs as JSON
     * @default false
     */
    useJsonFormat?: boolean;

    /**
     * Function to inject additional data into log records
     * Only used when useJsonFormat is true
     */
    logInjector?(record: LogRecord): LogRecord;

    /**
     * Whether to enable OpenTelemetry to Datadog trace ID conversion
     * @default false
     */
    enableOtelToDatadogTraceConversion?: boolean;
}