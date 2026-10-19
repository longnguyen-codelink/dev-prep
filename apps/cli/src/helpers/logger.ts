export class Logger {
  public static info(...args: any[]) {
    console.log(this.formatMessage("info", ...args));
  }

  public static error(...args: any[]) {
    console.error(this.formatMessage("error", ...args));
  }

  public static warn(...args: any[]) {
    console.warn(this.formatMessage("warn", ...args));
  }

  public static debug(...args: any[]) {
    console.debug(this.formatMessage("debug", ...args));
  }

  private static formatMessage(level: string, ...args: any[]) {
    const timestamp = new Date().toLocaleString();

    return `${timestamp} [${level.toUpperCase()}] ${args.join(" ")}`;
  }
}
