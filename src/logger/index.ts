import winston from "winston";
import config from "../config";

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
);

const logger = winston.createLogger({
    level: config.nodeEnv === "production" ? "info" : "debug",
    format: logFormat,
    defaultMeta: { service: "fix-it-now-api" },
    transports: [
        new winston.transports.Console({
            format:
                config.nodeEnv === "development"
                    ? winston.format.combine(
                        winston.format.colorize(),
                        winston.format.printf((info) => {
                            const { level, message, timestamp, stack } = info as winston.Logform.TransformableInfo & {
                                timestamp?: string;
                                stack?: string;
                            };
                            return `${timestamp} [${level}]: ${stack || String(message)}`;
                        }),
                    )
                    : logFormat,
        }),
    ],
});

export default logger;
