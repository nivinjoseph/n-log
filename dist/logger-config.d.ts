import { LogDateTimeZone } from "./log-date-time-zone.js";
import { LogRecord } from "./log-record.js";
export interface LoggerConfig {
    logDateTimeZone?: LogDateTimeZone;
    useJsonFormat?: boolean;
    logInjector?(record: LogRecord): LogRecord;
    enableOtelToDatadogTraceConversion?: boolean;
}
