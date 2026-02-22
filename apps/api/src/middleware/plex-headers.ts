import { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

export interface PlexRequestHeaders {
  plexToken?: string;
  plexClientIdentifier?: string;
  plexProduct?: string;
  plexVersion?: string;
  plexPlatform?: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    plexHeaders: PlexRequestHeaders;
  }
}

async function plexHeaders(fastify: FastifyInstance) {
  fastify.decorateRequest('plexHeaders', undefined as unknown as PlexRequestHeaders);

  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    request.plexHeaders = {
      plexToken: request.headers['x-plex-token'] as string | undefined,
      plexClientIdentifier: request.headers['x-plex-client-identifier'] as string | undefined,
      plexProduct: request.headers['x-plex-product'] as string | undefined,
      plexVersion: request.headers['x-plex-version'] as string | undefined,
      plexPlatform: request.headers['x-plex-platform'] as string | undefined,
    };
  });
}

export const plexHeadersPlugin = fp(plexHeaders, {
  name: 'plex-headers',
});
