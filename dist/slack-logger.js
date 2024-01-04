import { given } from "@nivinjoseph/n-defensive";
import { Duration } from "@nivinjoseph/n-util";
import Slack from "@slack/bolt";
import { BaseLogger } from "./base-logger.js";
export class SlackLogger extends BaseLogger {
    constructor(config) {
        var _a, _b;
        super(config);
        this._userImage = ":robot_face:";
        this._messages = new Array();
        this._isDisposed = false;
        this._disposePromise = null;
        // eslint-disable-next-line @typescript-eslint/unbound-method
        const { slackBotToken, slackBotChannel, slackUserName, slackUserImage, logFilter } = config;
        given(slackBotToken, "slackBotToken").ensureHasValue().ensureIsString();
        this._app = new Slack.App({
            receiver: new DummyReceiver(),
            token: slackBotToken
        });
        given(slackBotChannel, "slackBotChannel").ensureHasValue().ensureIsString();
        this._channel = slackBotChannel;
        given(slackUserName, "slackUserName").ensureIsString();
        if (slackUserName != null && slackUserName.isNotEmptyOrWhiteSpace())
            this._userName = slackUserName;
        else
            this._userName = this.service;
        given(slackUserImage, "slackUserImage").ensureIsString();
        if (slackUserImage != null && slackUserImage.isNotEmptyOrWhiteSpace())
            this._userImage = slackUserImage.trim();
        this._userImageIsEmoji = this._userImage.startsWith(":") && this._userImage.endsWith(":");
        const allFilters = ["Info", "Warn", "Error"];
        const filter = (_a = config.filter) !== null && _a !== void 0 ? _a : allFilters;
        given(filter, "filter").ensureIsArray().ensure(t => t.every(u => allFilters.contains(u)));
        this._includeInfo = filter.contains("Info");
        this._includeWarn = filter.contains("Warn");
        this._includeError = filter.contains("Error");
        given(logFilter, "logFilter").ensureIsFunction();
        this._logFilter = logFilter !== null && logFilter !== void 0 ? logFilter : ((_) => true);
        this._fallbackLogger = (_b = config.fallback) !== null && _b !== void 0 ? _b : null;
        this._timer = setInterval(() => {
            this._flushMessages()
                .catch(e => { var _a, _b; return (_b = (_a = this._fallbackLogger) === null || _a === void 0 ? void 0 : _a.logError(e).catch(e => console.error(e))) !== null && _b !== void 0 ? _b : console.error(e); });
        }, Duration.fromSeconds(30).toMilliSeconds());
    }
    async logDebug(debug) {
        if (this.env === "dev") {
            let log = {
                source: this.source,
                service: this.service,
                env: this.env,
                level: "Debug",
                message: debug,
                dateTime: this.getDateTime(),
                time: new Date().toISOString(),
                color: "#F8F8F8"
            };
            if (this.logInjector)
                log = this.logInjector(log);
            this._messages.push(log);
        }
    }
    async logInfo(info) {
        if (!this._includeInfo)
            return;
        let log = {
            source: this.source,
            service: this.service,
            env: this.env,
            level: "Info",
            message: info,
            dateTime: this.getDateTime(),
            time: new Date().toISOString(),
            color: "#259D2F"
        };
        if (!this._logFilter(log))
            return;
        if (this.logInjector)
            log = this.logInjector(log);
        this._messages.push(log);
    }
    async logWarning(warning) {
        if (!this._includeWarn)
            return;
        let log = {
            source: this.source,
            service: this.service,
            env: this.env,
            level: "Warn",
            message: this.getErrorMessage(warning),
            dateTime: this.getDateTime(),
            time: new Date().toISOString(),
            color: "#F1AB2A"
        };
        if (!this._logFilter(log))
            return;
        if (this.logInjector)
            log = this.logInjector(log);
        this._messages.push(log);
    }
    async logError(error) {
        if (!this._includeError)
            return;
        let log = {
            source: this.source,
            service: this.service,
            env: this.env,
            level: "Error",
            message: this.getErrorMessage(error),
            dateTime: this.getDateTime(),
            time: new Date().toISOString(),
            color: "#EF401D"
        };
        if (!this._logFilter(log))
            return;
        if (this.logInjector)
            log = this.logInjector(log);
        this._messages.push(log);
    }
    dispose() {
        if (!this._isDisposed) {
            this._isDisposed = true;
            clearInterval(this._timer);
            this._disposePromise = this._flushMessages();
        }
        return this._disposePromise;
    }
    async _flushMessages() {
        if (this._messages.isEmpty)
            return;
        const messagesToFlush = this._messages;
        this._messages = new Array();
        await this._postMessages(messagesToFlush);
    }
    async _postMessages(messages) {
        try {
            await this._app.client.chat.postMessage({
                username: this._userName,
                icon_emoji: this._userImageIsEmoji ? this._userImage : undefined,
                icon_url: !this._userImageIsEmoji ? this._userImage : undefined,
                channel: this._channel,
                text: `${this.service} [${this.env}]`,
                attachments: messages.map(log => {
                    return {
                        color: log.color,
                        blocks: [
                            {
                                type: "section",
                                text: {
                                    type: "plain_text",
                                    text: log.message
                                }
                            },
                            {
                                type: "context",
                                elements: [{
                                        type: "plain_text",
                                        text: log.dateTime
                                    }]
                            }
                        ]
                    };
                })
            });
        }
        catch (error) {
            if (this._fallbackLogger != null) {
                await this._fallbackLogger.logWarning("Error while posting to slack.");
                await this._fallbackLogger.logError(error);
                await this._fallbackLogger.logWarning("Original messages below");
                await messages.forEachAsync(async (log) => {
                    switch (log.level) {
                        case "Debug":
                            await this._fallbackLogger.logDebug(log.message);
                            break;
                        case "Info":
                            await this._fallbackLogger.logInfo(log.message);
                            break;
                        case "Warn":
                            await this._fallbackLogger.logWarning(log.message);
                            break;
                        case "Error":
                            await this._fallbackLogger.logError(log.message);
                            break;
                        default:
                            await this._fallbackLogger.logError(log.message);
                    }
                }, 1);
            }
            else {
                console.warn("Error while posting to slack.");
                console.error(error);
                console.warn("Original messages below");
                messages.forEach(log => {
                    switch (log.level) {
                        case "Debug":
                            console.info(log.message);
                            break;
                        case "Info":
                            console.info(log.message);
                            break;
                        case "Warn":
                            console.warn(log.message);
                            break;
                        case "Error":
                            console.error(log.message);
                            break;
                        default:
                            console.error(log.message);
                    }
                });
            }
        }
    }
}
class DummyReceiver {
    // @ts-expect-error: not used atm
    init(app) {
        // no-op
    }
    // @ts-expect-error: not used atm
    start(...args) {
        return Promise.resolve();
    }
    // @ts-expect-error: not used atm
    stop(...args) {
        return Promise.resolve();
    }
}
//# sourceMappingURL=slack-logger.js.map