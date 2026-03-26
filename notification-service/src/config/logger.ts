type LogLevel = "INFO" | "WARN" | "ERROR";

function formatLog(level: LogLevel, context: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `${timestamp} | ${level} | ${context} | ${message}`;
}

function createLogger(context: string) {
  return {
    info: (message: string) => console.log(formatLog("INFO", context, message)),
    warn: (message: string) => console.warn(formatLog("WARN", context, message)),
    error: (message: string) => console.error(formatLog("ERROR", context, message)),
  };
}

export const logger = {
  app: createLogger("notification_service"),
  controller: createLogger("notification_service.controller"),
  stream: createLogger("notification_service.stream"),
  broker: createLogger("notification_service.broker"),
  db: createLogger("notification_service.db"),
};
