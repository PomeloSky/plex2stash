import { FastifyInstance } from 'fastify';
import { providerController } from '../controllers/provider.controller.js';

export async function registerProviderRoutes(fastify: FastifyInstance) {
  // Provider root — Plex discovery (GET /providers/:stashId)
  fastify.get('/:stashId', providerController.getRoot.bind(providerController));

  // Match — Plex sends title/year/type, returns candidates
  fastify.post(
    '/:stashId/library/metadata/matches',
    providerController.matchMetadata.bind(providerController),
  );

  // Metadata — fetch Movie / Show / Season / Episode by ratingKey
  fastify.get(
    '/:stashId/library/metadata/:id',
    providerController.getMetadata.bind(providerController),
  );

  // Children — traverse Show → Season and Season → Episode hierarchy
  // Plex calls this to build TV library sections.
  fastify.get(
    '/:stashId/library/metadata/:id/children',
    providerController.getChildren.bind(providerController),
  );

  // Images — return proxied image URLs for any item type
  fastify.get(
    '/:stashId/library/metadata/:id/images',
    providerController.getImages.bind(providerController),
  );

  // Image proxy — streams images from Stash with API key auth
  fastify.get(
    '/:stashId/imageProxy',
    providerController.imageProxy.bind(providerController),
  );
}
