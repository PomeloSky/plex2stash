import Fastify from 'fastify';
import cors from '@fastify/cors';
import { configService } from './services/config.service.js';
import { loggerService } from './services/logger.service.js';
import { registerProviderRoutes } from './routes/provider.routes.js';
import { registerConfigRoutes } from './routes/config.routes.js';
import { registerLogRoutes } from './routes/log.routes.js';
import { plexHeadersPlugin } from './middleware/plex-headers.js';

const PORT = parseInt(process.env.PORT || '8787', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function bootstrap() {
  const app = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
      },
    },
  });

  // CORS for web UI
  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Parse X-Plex-* headers
  await app.register(plexHeadersPlugin);

  // Ensure config file exists
  await configService.ensureConfig();

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Register routes
  await app.register(registerProviderRoutes, { prefix: '/providers' });
  await app.register(registerConfigRoutes, { prefix: '/api/config' });
  await app.register(registerLogRoutes, { prefix: '/api/logs' });

  // Start
  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`Plex2Stash API running at http://${HOST}:${PORT}`);
    loggerService.info(`Plex2Stash API started on port ${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();
