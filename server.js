import 'dotenv/config';
import url from 'node:url';
import path from 'node:path';
import fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { createRequestHandler } from 'react-router';
import { createReadableStreamFromReadable } from '@react-router/node';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const BUILD_SERVER_PATH = path.resolve(__dirname, './build/server/index.js');
const BUILD_CLIENT_ASSETS_PATH = path.resolve(
  __dirname,
  './build/client/assets'
);
const PUBLIC_PATH = path.resolve(__dirname, 'public');

/**
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 * @returns {Request}
 */
function createReactRouterRequest(request, reply) {
  const url = new URL(request.url, `${request.protocol}://${request.hostname}`);
  const controller = new AbortController();
  reply.raw.on('close', () => controller.abort());

  const init = {
    method: request.method,
    headers: request.headers,
    signal: controller.signal,
  };

  if (
    request.method.toLowerCase() !== 'get' &&
    request.method.toLowerCase() !== 'head'
  ) {
    init.body = createReadableStreamFromReadable(request.raw);
    init.duplex = 'half';
  }

  return new Request(url.href, init);
}

/**
 * @param {import('fastify').FastifyInstance} app
 */
async function attachSSR(app) {
  const build = await import(BUILD_SERVER_PATH);
  const handler = createRequestHandler(build, process.env.NODE_ENV);

  app.all('*', async (request, reply) => {
    try {
      const reactRouterRequest = createReactRouterRequest(request, reply);
      const response = await handler(reactRouterRequest);

      reply.status(response.status);
      if (response.headers) {
        for (const [key, value] of response.headers.entries()) {
          reply.header(key, value);
        }
      }

      return reply.send(response.body);
    } catch (error) {
      console.error(error);
      return reply.status(500).send('Internal Server Error');
    }
  });
}

async function main() {
  const app = fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  // Serve static assets from 'build/client/assets' directory.
  // These are fingerprinted, so they can be cached forever.
  await app.register(fastifyStatic, {
    root: BUILD_CLIENT_ASSETS_PATH,
    prefix: '/assets',
    wildcard: false,
    immutable: true,
    maxAge: '1y',
  });

  // Serve other static assets from 'public' folder.
  await app.register(fastifyStatic, {
    root: PUBLIC_PATH,
    prefix: '/',
    wildcard: false,
    decorateReply: false,
  });

  // Attach the server-side rendering handler.
  await attachSSR(app);

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
