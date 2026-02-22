import { FastifyRequest, FastifyReply } from 'fastify';
import { configService } from '../services/config.service.js';
import { stashService } from '../services/stash.service.js';
import { cacheService } from '../services/cache.service.js';
import { CreateStashSchema, UpdateStashSchema } from '../schemas/config.schema.js';

interface StashIdParam {
  id: string;
}

export class ConfigController {
  /** GET /api/config/stashes — List all stashes (sorted by priority) */
  async listStashes(_request: FastifyRequest, reply: FastifyReply) {
    const stashes = await configService.getStashes();
    const sorted = [...stashes].sort((a, b) => a.priority - b.priority);
    return reply.send({ stashes: sorted });
  }

  /** GET /api/config/stashes/:id — Get a single stash */
  async getStash(
    request: FastifyRequest<{ Params: StashIdParam }>,
    reply: FastifyReply,
  ) {
    const stash = await configService.getStash(request.params.id);
    if (!stash) {
      return reply.status(404).send({
        error: 'Not Found',
        message: `Stash "${request.params.id}" not found`,
      });
    }
    return reply.send({ stash });
  }

  /** POST /api/config/stashes — Create a new stash */
  async createStash(
    request: FastifyRequest<{ Body: unknown }>,
    reply: FastifyReply,
  ) {
    const parseResult = CreateStashSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: parseResult.error.flatten(),
      });
    }

    try {
      const stash = await configService.addStash(parseResult.data);
      return reply.status(201).send({ stash });
    } catch (err: any) {
      return reply.status(409).send({
        error: 'Conflict',
        message: err.message,
      });
    }
  }

  /** PUT /api/config/stashes/:id — Update a stash */
  async updateStash(
    request: FastifyRequest<{ Params: StashIdParam; Body: unknown }>,
    reply: FastifyReply,
  ) {
    const parseResult = UpdateStashSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: parseResult.error.flatten(),
      });
    }

    try {
      const stash = await configService.updateStash(request.params.id, parseResult.data);
      return reply.send({ stash });
    } catch (err: any) {
      return reply.status(404).send({
        error: 'Not Found',
        message: err.message,
      });
    }
  }

  /** DELETE /api/config/stashes/:id — Delete a stash */
  async deleteStash(
    request: FastifyRequest<{ Params: StashIdParam }>,
    reply: FastifyReply,
  ) {
    const deleted = await configService.deleteStash(request.params.id);
    if (!deleted) {
      return reply.status(404).send({
        error: 'Not Found',
        message: `Stash "${request.params.id}" not found`,
      });
    }
    return reply.status(204).send();
  }

  /** POST /api/config/stashes/:id/ping — Test connection */
  async pingStash(
    request: FastifyRequest<{ Params: StashIdParam }>,
    reply: FastifyReply,
  ) {
    const stash = await configService.getStash(request.params.id);
    if (!stash) {
      return reply.status(404).send({
        error: 'Not Found',
        message: `Stash "${request.params.id}" not found`,
      });
    }

    const result = await stashService.ping(stash);
    return reply.send(result);
  }

  /** PUT /api/config/stashes/reorder — Batch update priorities */
  async reorderStashes(
    request: FastifyRequest<{ Body: unknown }>,
    reply: FastifyReply,
  ) {
    const body = request.body as { order?: string[] };
    if (!Array.isArray(body?.order)) {
      return reply.status(400).send({ error: 'order must be a string array' });
    }

    for (let i = 0; i < body.order.length; i++) {
      try {
        await configService.updateStash(body.order[i], { priority: i });
      } catch {
        // skip if stash not found
      }
    }

    const stashes = await configService.getStashes();
    return reply.send({ stashes: [...stashes].sort((a, b) => a.priority - b.priority) });
  }

  /** GET /api/config/cache — Cache stats */
  async getCacheStats(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send(cacheService.stats());
  }

  /** DELETE /api/config/cache — Clear cache */
  async clearCache(_request: FastifyRequest, reply: FastifyReply) {
    cacheService.clear();
    return reply.send({ cleared: true });
  }
}

export const configController = new ConfigController();
