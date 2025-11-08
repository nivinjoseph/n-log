import "@nivinjoseph/n-ext";
import { ConsoleLogger } from "./console-logger.js";
import { FileLogger } from "./file-logger.js";
import { LogDateTimeZone } from "./log-date-time-zone.js";
import { SlackLogger } from "./slack-logger.js";
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
export { 
/** Console logger implementation */
ConsoleLogger, 
/** File logger implementation */
FileLogger, 
/** Supported timezones for log timestamps */
LogDateTimeZone, 
/** Slack logger implementation */
SlackLogger };
//# sourceMappingURL=index.js.map