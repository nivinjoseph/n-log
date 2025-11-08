/**
 * Interface representing a log record in JSON format
 */
export interface LogRecord {
    /** Source identifier (e.g. "nodejs") */
    source: string;
    /** Service name (e.g. package name) */
    service: string;
    /** Environment identifier (e.g. "dev", "stage", "prod") */
    env: string;
    /** Log level (e.g. "Debug", "Info", "Warn", "Error") */
    level: string;
    /** The actual log message */
    message: string;
    /** Formatted date-time string in configured timezone */
    dateTime: string;
    /** ISO formatted date-time string */
    time: string;
}
