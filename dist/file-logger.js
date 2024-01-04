import { given } from "@nivinjoseph/n-defensive";
import "@nivinjoseph/n-ext";
import { Duration, Make, Mutex } from "@nivinjoseph/n-util";
import Fs from "node:fs";
import Path from "node:path";
import { BaseLogger } from "./base-logger.js";
import { LogPrefix } from "./log-prefix.js";
import { DateTime } from "luxon";
// public
export class FileLogger extends BaseLogger {
    /**
     *
     * @param logDateTimeZone Default is LogDateTimeZone.utc
     * @param useJsonFormat Default is false
     */
    constructor(config) {
        super(config);
        this._mutex = new Mutex();
        this._lastPurgedAt = 0;
        const { logDirPath, retentionDays } = config;
        given(logDirPath, "logDirPath").ensureHasValue().ensureIsString()
            .ensure(t => Path.isAbsolute(t), "must be absolute");
        given(retentionDays, "retentionDays").ensureHasValue().ensureIsNumber().ensure(t => t > 0);
        this._retentionDays = Number.parseInt(retentionDays.toString());
        if (!Fs.existsSync(logDirPath))
            Fs.mkdirSync(logDirPath);
        this._logDirPath = logDirPath;
    }
    async logDebug(debug) {
        if (this.env === "dev")
            await this._writeToLog(LogPrefix.debug, debug);
    }
    async logInfo(info) {
        await this._writeToLog(LogPrefix.info, info);
    }
    async logWarning(warning) {
        await this._writeToLog(LogPrefix.warning, this.getErrorMessage(warning));
    }
    async logError(error) {
        await this._writeToLog(LogPrefix.error, this.getErrorMessage(error));
    }
    async _writeToLog(status, message) {
        given(status, "status").ensureHasValue().ensureIsEnum(LogPrefix);
        given(message, "message").ensureHasValue().ensureIsString();
        const dateTime = this.getDateTime();
        if (this.useJsonFormat) {
            let level = "";
            switch (status) {
                case LogPrefix.debug:
                    level = "Debug";
                    break;
                case LogPrefix.info:
                    level = "Info";
                    break;
                case LogPrefix.warning:
                    level = "Warn";
                    break;
                case LogPrefix.error:
                    level = "Error";
                    break;
            }
            let log = {
                source: this.source,
                service: this.service,
                env: this.env,
                level: level,
                message,
                dateTime,
                time: new Date().toISOString()
            };
            this.injectTrace(log, level === "Error");
            if (this.logInjector)
                log = this.logInjector(log);
            message = JSON.stringify(log);
        }
        else {
            message = `${dateTime} ${status} ${message}`;
        }
        const logFileName = `${dateTime.substr(0, 13)}.log`;
        const logFilePath = Path.join(this._logDirPath, logFileName);
        await this._mutex.lock();
        try {
            await Fs.promises.appendFile(logFilePath, `\n${message}`);
            await this._purgeLogs();
        }
        catch (error) {
            console.error(error);
        }
        finally {
            this._mutex.release();
        }
    }
    async _purgeLogs() {
        const now = Date.now();
        if (this._lastPurgedAt && this._lastPurgedAt > (now - Duration.fromDays(this._retentionDays).toMilliSeconds()))
            return;
        const files = await Make.callbackToPromise(Fs.readdir)(this._logDirPath);
        await files.forEachAsync(async (file) => {
            const filePath = Path.join(this._logDirPath, file);
            const stats = await Make.callbackToPromise(Fs.stat)(filePath);
            if (stats.isFile() && DateTime.fromJSDate(stats.birthtime).valueOf() < (now - Duration.fromDays(this._retentionDays).toMilliSeconds()))
                await Make.callbackToPromise(Fs.unlink)(filePath);
        }, 1);
        this._lastPurgedAt = now;
    }
}
//# sourceMappingURL=file-logger.js.map