/**
 * Enum representing supported timezones for log timestamps
 */
export enum LogDateTimeZone
{
    /** Coordinated Universal Time */
    utc = "utc",

    /** System's local timezone */
    local = "local",

    /** Eastern Time (America/New_York) */
    est = "America/New_York",

    /** Pacific Time (America/Los_Angeles) */
    pst = "America/Los_Angeles"
}