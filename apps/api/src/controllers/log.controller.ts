import { FastifyRequest, FastifyReply } from 'fastify';
import type { LogLevel } from '@plex2stash/plex-types';
import { loggerService } from '../services/logger.service.js';

const VALID_LEVELS: LogLevel[] = ['trace', 'debug', 'info', 'warning', 'error'];

interface LogQuery {
  date?: string;
  level?: string;
  stashId?: string;
}

export class LogController {
  /**
   * GET /api/logs
   * Returns filtered log entries for a given date.
   *
   * Query params:
   *   date    — YYYY-MM-DD, defaults to today
   *   level   — trace | debug | info | warning | error
   *   stashId — filter by stash id
   */
  async getLogs(
    request: FastifyRequest<{ Querystring: LogQuery }>,
    reply: FastifyReply,
  ) {
    const { date, level, stashId } = request.query;

    const resolvedLevel =
      level && VALID_LEVELS.includes(level as LogLevel)
        ? (level as LogLevel)
        : undefined;

    const logs = await loggerService.readLogs(date, resolvedLevel, stashId || undefined);
    return reply.send({ logs, count: logs.length });
  }

  /**
   * GET /api/logs/dates
   * Returns the list of available log dates (newest first).
   */
  async getDates(_request: FastifyRequest, reply: FastifyReply) {
    const dates = await loggerService.listDates();
    return reply.send({ dates });
  }
}

export const logController = new LogController();
