import { FastifyRequest, FastifyReply } from 'fastify';
import { providerService } from '../services/provider.service.js';
import { MatchRequestSchema } from '../schemas/match.schema.js';
import { configService } from '../services/config.service.js';
import { stashService } from '../services/stash.service.js';
import { cacheService } from '../services/cache.service.js';

interface StashIdParam {
  stashId: string;
}

interface ItemIdParam extends StashIdParam {
  id: string;
}

interface ImageProxyQuery {
  url?: string;
}

async function requireEnabledStash(
  stashId: string,
  reply: FastifyReply,
): Promise<boolean> {
  const stash = await configService.getStash(stashId);

  if (!stash) {
    reply.status(404).send({
      error: 'Not Found',
      message: `Stash "${stashId}" not found in configuration`,
    });
    return false;
  }

  if (!stash.enabled) {
    reply.status(404).send({
      error: 'Not Found',
      message: `Provider "${stashId}" is currently disabled`,
    });
    return false;
  }

  return true;
}

export class ProviderController {
  /** GET /providers/:stashId — Provider root (Plex discovery) */
  async getRoot(
    request: FastifyRequest<{ Params: StashIdParam }>,
    reply: FastifyReply,
  ) {
    const { stashId } = request.params;
    if (!(await requireEnabledStash(stashId, reply))) return;

    const result = await providerService.getProviderRoot(stashId);
    return reply.send(result);
  }

  /**
   * POST /providers/:stashId/library/metadata/matches — Match with fallback
   *
   * Accepts parameters from both JSON body AND URL query string.
   * Plex may send title/year/type either way depending on server version.
   * Query params are merged first, then body fields override them,
   * so explicit body values always take precedence.
   */
  async matchMetadata(
    request: FastifyRequest<{ Params: StashIdParam; Body: unknown; Querystring: unknown }>,
    reply: FastifyReply,
  ) {
    const { stashId } = request.params;
    if (!(await requireEnabledStash(stashId, reply))) return;

    // Merge query params and body so either source works.
    // Body takes precedence over query when both supply the same key.
    const payload = {
      ...(typeof request.query === 'object' && request.query !== null ? request.query : {}),
      ...(typeof request.body === 'object' && request.body !== null ? request.body : {}),
    };

    const parseResult = MatchRequestSchema.safeParse(payload);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: parseResult.error.flatten(),
      });
    }

    const result = await providerService.matchMetadataWithFallback(stashId, parseResult.data);
    return reply.send(result);
  }

  /** GET /providers/:stashId/library/metadata/:id — Get metadata (all types) */
  async getMetadata(
    request: FastifyRequest<{ Params: ItemIdParam }>,
    reply: FastifyReply,
  ) {
    const { stashId, id } = request.params;
    if (!(await requireEnabledStash(stashId, reply))) return;

    const result = await providerService.getMetadata(stashId, id);
    return reply.send(result);
  }

  /**
   * GET /providers/:stashId/library/metadata/:id/children
   * Plex calls this to traverse the Show → Season → Episode hierarchy:
   *   • show.*   → returns Season list
   *   • season.* → returns Episode list
   */
  async getChildren(
    request: FastifyRequest<{ Params: ItemIdParam }>,
    reply: FastifyReply,
  ) {
    const { stashId, id } = request.params;
    if (!(await requireEnabledStash(stashId, reply))) return;

    const result = await providerService.getChildren(stashId, id);
    return reply.send(result);
  }

  /** GET /providers/:stashId/library/metadata/:id/images — Get images */
  async getImages(
    request: FastifyRequest<{ Params: ItemIdParam }>,
    reply: FastifyReply,
  ) {
    const { stashId, id } = request.params;
    if (!(await requireEnabledStash(stashId, reply))) return;

    const result = await providerService.getImages(stashId, id);
    return reply.send(result);
  }

  /**
   * GET /providers/:stashId/imageProxy?url=<encoded>
   * Proxies images from Stash with authentication so Plex can fetch
   * images without knowing the Stash API key.
   */
  async imageProxy(
    request: FastifyRequest<{ Params: StashIdParam; Querystring: ImageProxyQuery }>,
    reply: FastifyReply,
  ) {
    const { stashId } = request.params;
    const { url } = request.query;

    if (!url) {
      return reply.status(400).send({ error: 'url query parameter is required' });
    }

    const stash = await configService.getStash(stashId);
    if (!stash) {
      return reply.status(404).send({ error: 'Stash not found' });
    }

    // Security: only proxy URLs from the configured stash endpoint
    const stashOrigin = new URL(stash.endpoint).origin;
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      targetUrl = new URL(url, stashOrigin);
    }

    if (targetUrl.origin !== stashOrigin) {
      return reply.status(403).send({ error: 'URL origin does not match stash endpoint' });
    }

    const imgCacheKey = `img:${stashId}:${targetUrl.href}`;
    const cachedImg = cacheService.getMetadata(imgCacheKey) as
      | { contentType: string; buffer: Buffer }
      | undefined;

    if (cachedImg) {
      return reply
        .header('Content-Type', cachedImg.contentType)
        .header('Cache-Control', 'public, max-age=21600')
        .send(cachedImg.buffer);
    }

    const headers: Record<string, string> = {};
    if (stash.apiKey) {
      headers['ApiKey'] = stash.apiKey;
    }

    try {
      const res = await fetch(targetUrl.href, { headers });
      if (!res.ok) {
        return reply.status(res.status).send({ error: `Stash returned ${res.status}` });
      }

      const contentType = res.headers.get('content-type') || 'image/jpeg';
      const arrayBuf = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);

      cacheService.setMetadata(imgCacheKey, { contentType, buffer });

      return reply
        .header('Content-Type', contentType)
        .header('Cache-Control', 'public, max-age=21600')
        .send(buffer);
    } catch (err: any) {
      return reply.status(502).send({ error: `Image fetch failed: ${err.message}` });
    }
  }
}

export const providerController = new ProviderController();
