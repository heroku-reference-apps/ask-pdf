import 'dotenv/config';
import fastify from 'fastify';
import formbody from '@fastify/formbody';
import multipart from '@fastify/multipart';
import { reactRouterFastify } from '@mcansh/remix-fastify/react-router';

async function main() {
  const app = fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  // Register form data parsers
  await app.register(formbody);
  await app.register(multipart);

  // Attach the React Router handler, which will also handle serving static assets.
  await app.register(reactRouterFastify);

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const host = process.env.HOST || '0.0.0.0';

  try {
    const address = await app.listen({ port, host });
    console.log(`✅ Fastify server listening on ${address}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
