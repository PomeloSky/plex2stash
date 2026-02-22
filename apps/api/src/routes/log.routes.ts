import { FastifyInstance } from 'fastify';
import { logController } from '../controllers/log.controller.js';

export async function registerLogRoutes(fastify: FastifyInstance) {
  // GET /api/logs — query log entries with date/level/stashId filters
  fastify.get('/', logController.getLogs.bind(logController));

  // GET /api/logs/dates — list available log dates
  fastify.get('/dates', logController.getDates.bind(logController));
}
