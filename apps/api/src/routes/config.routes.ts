import { FastifyInstance } from 'fastify';
import { configController } from '../controllers/config.controller.js';

export async function registerConfigRoutes(fastify: FastifyInstance) {
  // Stash CRUD
  fastify.get('/stashes', configController.listStashes.bind(configController));
  fastify.get('/stashes/:id', configController.getStash.bind(configController));
  fastify.post('/stashes', configController.createStash.bind(configController));
  fastify.put('/stashes/:id', configController.updateStash.bind(configController));
  fastify.delete('/stashes/:id', configController.deleteStash.bind(configController));

  // Stash operations
  fastify.post('/stashes/:id/ping', configController.pingStash.bind(configController));
  fastify.put('/stashes/reorder', configController.reorderStashes.bind(configController));

  // Cache management
  fastify.get('/cache', configController.getCacheStats.bind(configController));
  fastify.delete('/cache', configController.clearCache.bind(configController));
}
