"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const n_exception_1 = require("@nivinjoseph/n-exception");
const Colors = require("colors");
const n_config_1 = require("@nivinjoseph/n-config");
const moment = require("moment-timezone");
const log_date_time_zone_1 = require("./log-date-time-zone");
require("@nivinjoseph/n-ext");
class ConsoleLogger {
    constructor(logDateTimeZone) {
        if (!logDateTimeZone || logDateTimeZone.isEmptyOrWhiteSpace() ||
            ![log_date_time_zone_1.LogDateTimeZone.utc, log_date_time_zone_1.LogDateTimeZone.local, log_date_time_zone_1.LogDateTimeZone.est, log_date_time_zone_1.LogDateTimeZone.pst].contains(logDateTimeZone)) {
            this._logDateTimeZone = log_date_time_zone_1.LogDateTimeZone.utc;
        }
        else {
            this._logDateTimeZone = logDateTimeZone;
        }
    }
    logDebug(debug) {
        if (n_config_1.ConfigurationManager.getConfig("env") === "dev")
            console.log(Colors.grey(`${this.getDateTime()} DEBUG: ${debug}`));
        return Promise.resolve();
    }
    logInfo(info) {
        console.log(Colors.green(`${this.getDateTime()} INFO: ${info}`));
        return Promise.resolve();
    }
    logWarning(warning) {
        console.log(Colors.yellow(`${this.getDateTime()} WARNING: ${warning}`));
        return Promise.resolve();
    }
    logError(error) {
        console.log(Colors.red(`${this.getDateTime()} ERROR: ${this.getErrorMessage(error)}`));
        return Promise.resolve();
    }
    getErrorMessage(exp) {
        let logMessage = "";
        try {
            if (exp instanceof n_exception_1.Exception)
                logMessage = exp.toString();
            else if (exp instanceof Error)
                logMessage = exp.stack;
            else
                logMessage = exp.toString();
        }
        catch (error) {
            console.warn(error);
            logMessage = "There was an error while attempting to log another error.";
        }
        return logMessage;
    }
    getDateTime() {
        let result = null;
        switch (this._logDateTimeZone) {
            case log_date_time_zone_1.LogDateTimeZone.utc:
                result = moment().utc().format();
                break;
            case log_date_time_zone_1.LogDateTimeZone.local:
                result = moment().format();
                break;
            case log_date_time_zone_1.LogDateTimeZone.est:
                result = moment().tz("America/New_York").format();
                break;
            case log_date_time_zone_1.LogDateTimeZone.pst:
                result = moment().tz("America/Los_Angeles").format();
                break;
            default:
                result = moment().utc().format();
                break;
        }
        return result;
    }
}
exports.ConsoleLogger = ConsoleLogger;
//# sourceMappingURL=console-logger.js.map