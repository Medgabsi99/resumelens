type LogLevel = "debug" | "info" | "warn" | "error";

interface LogMessage {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: any;
}

class StructuredLogger {
  private format(level: LogLevel, message: string, context?: any): string {
    const logObj: LogMessage = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };
    if (context !== undefined) {
      if (context instanceof Error) {
        logObj.context = {
          name: context.name,
          message: context.message,
          stack: context.stack,
        };
      } else {
        logObj.context = context;
      }
    }

    if (process.env.NODE_ENV === "production") {
      return JSON.stringify(logObj);
    }

    const contextStr = context
      ? `\n${JSON.stringify(context instanceof Error ? { message: context.message, stack: context.stack } : context, null, 2)}`
      : "";
    return `[${logObj.timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: any) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(this.format("debug", message, context));
    }
  }

  info(message: string, context?: any) {
    console.info(this.format("info", message, context));
  }

  warn(message: string, context?: any) {
    console.warn(this.format("warn", message, context));
  }

  error(message: string, context?: any) {
    console.error(this.format("error", message, context));
  }
}

export const logger = new StructuredLogger();
export default logger;
