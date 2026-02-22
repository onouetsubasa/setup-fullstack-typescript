import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  serializers: {
    err: pino.stdSerializers.err,
  },
  redact: {
    paths: [
      "*.password",
      "*.passwordConfirmation",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
      "*.email",
      "*.phoneNumber",
      "*.creditCard",
      "*.cardNumber",
    ],
    censor: "[REDACTED]",
  },
  ...(process.env.NODE_ENV !== "production" && {
    transport: {
      target: "pino-pretty",
      options: { colorize: true },
    },
  }),
});
