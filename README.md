# n-log

A flexible and extensible logging framework for Node.js applications.

## Features

- Multiple logger implementations (Console, File, Slack)
- Configurable log levels and formatting
- JSON and plain text output support
- Timezone-aware timestamps
- OpenTelemetry trace integration
- Extensible through custom log injectors
- Thread-safe file logging with rotation
- Slack integration with message batching
- Environment-aware logging (dev/prod)

## Installation

```bash
npm install @nivinjoseph/n-log

or 

yarn add @nivinjoseph/n-log
```

## Usage

### Basic Console Logging

```typescript
import { ConsoleLogger } from "@nivinjoseph/n-log";

// Create a console logger with default settings
const logger = new ConsoleLogger();

// Log messages at different levels
await logger.logDebug("Debug message"); // Only logs in dev environment
await logger.logInfo("Info message");
await logger.logWarning("Warning message");
await logger.logError("Error message");
```

### File Logging

```typescript
import { FileLogger, FileLoggerConfig, LogDateTimeZone } from "@nivinjoseph/n-log";
import { join } from "path";

// Configure file logger
const config: FileLoggerConfig = {
    logDirPath: join(process.cwd(), "logs"),
    retentionDays: 7, // Keep logs for 7 days
    logDateTimeZone: LogDateTimeZone.utc,
    useJsonFormat: true // Output logs as JSON
};

// Create file logger
const logger = new FileLogger(config);

// Log messages
await logger.logInfo("Application started");
await logger.logError(new Error("Something went wrong"));
```

### Slack Logging

```typescript
import { SlackLogger, SlackLoggerConfig } from "@nivinjoseph/n-log";

// Configure Slack logger
const config: SlackLoggerConfig = {
    slackBotToken: "xoxb-your-bot-token",
    slackBotChannel: "#logs",
    slackUserName: "MyApp Logger",
    slackUserImage: ":robot_face:",
    filter: ["Info", "Warn", "Error"], // Only log these levels
    fallback: new ConsoleLogger() // Fallback to console if Slack fails
};

// Create Slack logger
const logger = new SlackLogger(config);

// Log messages
await logger.logInfo("New user registered");
await logger.logError(new Error("Payment processing failed"));
```

### Custom Log Injector

```typescript
import { LoggerConfig, LogRecord } from "@nivinjoseph/n-log";

// Create a custom log injector to add request ID to all logs
const config: LoggerConfig = {
    useJsonFormat: true,
    logInjector: (record: LogRecord): LogRecord => ({
        ...record,
        requestId: "req-123" // Add custom field
    })
};

// Use with any logger
const logger = new ConsoleLogger(config);
```

### Creating Custom Logger

```typescript
import { BaseLogger, LoggerConfig, LogRecord } from "@nivinjoseph/n-log";

// Create a custom logger that sends logs to a REST API
class RestLogger extends BaseLogger {
    private readonly _endpoint: string;

    public constructor(config: LoggerConfig & { endpoint: string }) {
        super(config);
        this._endpoint = config.endpoint;
    }

    public async logDebug(debug: string): Promise<void> {
        if (this.env === "dev") {
            await this._sendLog("Debug", debug);
        }
    }

    public async logInfo(info: string): Promise<void> {
        await this._sendLog("Info", info);
    }

    public async logWarning(warning: string | Exception): Promise<void> {
        await this._sendLog("Warn", this.getErrorMessage(warning));
    }

    public async logError(error: string | Exception): Promise<void> {
        await this._sendLog("Error", this.getErrorMessage(error));
    }

    private async _sendLog(level: string, message: string): Promise<void> {
        const log: LogRecord = {
            source: this.source,
            service: this.service,
            env: this.env,
            level,
            message,
            dateTime: this.getDateTime(),
            time: new Date().toISOString()
        };

        if (this.logInjector) {
            this.logInjector(log);
        }

        // Send to REST API
        await fetch(this._endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(log)
        });
    }
}
```

## Configuration Options

### Base Logger Configuration

```typescript
interface LoggerConfig {
    // Timezone for log timestamps (default: UTC)
    logDateTimeZone?: LogDateTimeZone;

    // Format logs as JSON (default: false)
    useJsonFormat?: boolean;

    // Function to inject additional data into log records
    logInjector?: (record: LogRecord) => LogRecord;

    // Enable OpenTelemetry to Datadog trace ID conversion
    enableOtelToDatadogTraceConversion?: boolean;
}
```

### File Logger Configuration

```typescript
interface FileLoggerConfig extends LoggerConfig {
    // Absolute path to log directory
    logDirPath: string;

    // Number of days to retain logs
    retentionDays: number;
}
```

### Slack Logger Configuration

```typescript
interface SlackLoggerConfig extends LoggerConfig {
    // Slack bot token
    slackBotToken: string;

    // Slack channel to post logs
    slackBotChannel: string;

    // Custom bot username (default: service name)
    slackUserName?: string;

    // Custom bot image (default: robot_face emoji)
    slackUserImage?: string;

    // Filter which log levels to post
    filter?: Array<"Info" | "Warn" | "Error">;

    // Custom log filter function
    logFilter?: (record: LogRecord) => boolean;

    // Fallback logger if Slack fails
    fallback?: Logger;
}
```

## Log Record Format

When using JSON format, logs are structured as:

```typescript
interface LogRecord {
    // Source identifier (e.g. "nodejs")
    source: string;

    // Service name (e.g. package name)
    service: string;

    // Environment identifier (e.g. "dev", "prod")
    env: string;

    // Log level (e.g. "Debug", "Info", "Warn", "Error")
    level: string;

    // The actual log message
    message: string;

    // Formatted date-time in configured timezone
    dateTime: string;

    // ISO formatted date-time
    time: string;
}
```

## Extending the Framework

The framework is designed to be easily extended with new logger implementations. To create a custom logger:

1. Extend the `BaseLogger` class
2. Implement the required logging methods
3. Add any custom configuration options
4. Handle log formatting and output

The `BaseLogger` provides common functionality like:
- Timezone handling
- Error message extraction
- Trace injection
- Log record formatting
- Environment detection

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
