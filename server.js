import 'dotenv/config';
import url from 'node:url';
import path from 'node:path';
import fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import formbody from '@fastify/formbody';
import multipart from '@fastify/multipart';
import { reactRouterFastify } from '@mcansh/remix-fastify/react-router';

async function main() {
  const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
  const app = fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  // Register form data parsers
  await app.register(formbody);
  await app.register(multipart);

  // Serve static assets from 'build/client/assets' directory.
  // These are fingerprinted, so they can be cached forever.
  await app.register(fastifyStatic, {
    root: path.resolve(__dirname, 'build/client/assets'),
    prefix: '/assets',
    wildcard: false,
    immutable: true,
    maxAge: '1y',
  });

  // Serve other static assets from 'public' folder.
  await app.register(fastifyStatic, {
    root: path.resolve(__dirname, 'public'),
    prefix: '/',
    wildcard: false,
    decorateReply: false,
  });

  // Attach the React Router handler.
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
