import fs from 'node:fs/promises';
import path from 'node:path';
import type { LogEntry, LogLevel } from '@plex2stash/plex-types';
import { LOG_DIR } from '../config/constants.js';

/**
 * File-based logger service.
 *
 * Writes structured JSONL entries to daily log files:
 *   {DATA_DIR}/log/YYYY-MM-DD.log
 *
 * Each line is a JSON object: { timestamp, level, stashId?, message }
 * Uses fire-and-forget writes so logging never blocks request handling.
 */
class LoggerService {
  private initialized = false;

  /** Lazily ensure the log directory exists. */
  private async ensureDir(): Promise<void> {
    if (this.initialized) return;
    try {
      await fs.mkdir(LOG_DIR, { recursive: true });
      this.initialized = true;
    } catch {
      // ignore; will retry on next write
    }
  }

  /** Derive today's log file path. */
  private logFilePath(date?: string): string {
    const d = date ?? new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return path.join(LOG_DIR, `${d}.log`);
  }

  /** Write a log entry (fire-and-forget, never throws). */
  private writeEntry(level: LogLevel, message: string, stashId?: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      stashId: stashId ?? undefined,
      message,
    };
    // Fire-and-forget
    void this.ensureDir()
      .then(() => fs.appendFile(this.logFilePath(), JSON.stringify(entry) + '\n', 'utf-8'))
      .catch(() => { /* intentionally silent */ });
  }

  trace(message: string, stashId?: string): void   { this.writeEntry('trace',   message, stashId); }
  debug(message: string, stashId?: string): void   { this.writeEntry('debug',   message, stashId); }
  info(message: string, stashId?: string): void    { this.writeEntry('info',    message, stashId); }
  warning(message: string, stashId?: string): void { this.writeEntry('warning', message, stashId); }
  error(message: string, stashId?: string): void   { this.writeEntry('error',   message, stashId); }

  /**
   * Read and filter log entries for a given date.
   *
   * @param date    - ISO date string YYYY-MM-DD (defaults to today)
   * @param level   - filter by log level (optional)
   * @param stashId - filter by stash id (optional)
   */
  async readLogs(
    date?: string,
    level?: LogLevel,
    stashId?: string,
  ): Promise<LogEntry[]> {
    const filePath = this.logFilePath(date);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const entries = content
        .split('\n')
        .filter(Boolean)
        .flatMap((line) => {
          try { return [JSON.parse(line) as LogEntry]; }
          catch { return []; }
        });

      return entries.filter((e) => {
        if (level && e.level !== level) return false;
        if (stashId && e.stashId !== stashId) return false;
        return true;
      });
    } catch {
      return [];
    }
  }

  /**
   * List available log dates (file stems in the log directory).
   */
  async listDates(): Promise<string[]> {
    try {
      await this.ensureDir();
      const files = await fs.readdir(LOG_DIR);
      return files
        .filter((f) => f.endsWith('.log'))
        .map((f) => f.slice(0, -4))  // strip .log
        .sort()
        .reverse();
    } catch {
      return [];
    }
  }
}

export const loggerService = new LoggerService();
