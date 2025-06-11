import fs from 'node:fs';
import url from 'node:url';
import path from 'node:path';
import fastify from 'fastify';
import { createRequestHandler } from '@react-router/node';
import { broadcastDevReady, installGlobals } from 'react-router';
import { fastifyEarlyHints } from '@fastify/early-hints';
import { fastifyStatic } from '@fastify/static';

installGlobals();

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const BUILD_PATH = './build/server/index.js';
const VERSION_PATH = './build/version.txt';

/** @typedef {import('react-router').ServerBuild} ServerBuild */

/** @type {ServerBuild} */
const initialBuild = await import(BUILD_PATH);

let reactRouterHandler;

if (process.env.NODE_ENV === 'development') {
  reactRouterHandler = await createDevRequestHandler(initialBuild);
} else {
  reactRouterHandler = createRequestHandler({
    build: initialBuild,
    mode: initialBuild.mode,
  });
}

// Create a Fastify-compatible handler
function createFastifyHandler(handler) {
  return async (request, reply) => {
    const req = request.raw;
    const res = reply.raw;

    return handler(req, res);
  };
}

const handler = createFastifyHandler(reactRouterHandler);

const app = fastify();

const noopContentParser = (_request, payload, done) => {
  done(null, payload);
};

app.addContentTypeParser('application/json', noopContentParser);
app.addContentTypeParser('*', noopContentParser);

await app.register(fastifyEarlyHints, { warn: true });

await app.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/',
  wildcard: false,
  cacheControl: true,
  dotfiles: 'allow',
  etag: true,
  maxAge: '1h',
  serveDotFiles: true,
  lastModified: true,
});

await app.register(fastifyStatic, {
  root: path.join(__dirname, 'build', 'client'),
  prefix: '/assets',
  wildcard: true,
  decorateReply: false,
  cacheControl: true,
  dotfiles: 'allow',
  etag: true,
  maxAge: '1y',
  immutable: true,
  serveDotFiles: true,
  lastModified: true,
});

app.all('*', async (request, reply) => {
  return handler(request, reply);
});

const port = process.env.PORT ? Number(process.env.PORT) || 3000 : 3000;

const address = await app.listen({ port, host: '::' });
console.log(`✅ app ready: ${address}`);

if (process.env.NODE_ENV === 'development') {
  await broadcastDevReady(initialBuild);
}

/**
 * @param {ServerBuild} initialBuild
 * @returns {Promise<import('@react-router/node').RequestHandler>}
 */
async function createDevRequestHandler(initialBuild) {
  let build = initialBuild;

  async function handleServerUpdate() {
    // 1. re-import the server build
    build = await reimportServer();
    // 2. tell React Router that this app server is now up-to-date and ready
    await broadcastDevReady(build);
  }

  const chokidar = await import('chokidar');
  chokidar
    .watch(VERSION_PATH, { ignoreInitial: true })
    .on('add', handleServerUpdate)
    .on('change', handleServerUpdate);

  return async (request, reply) => {
    return createRequestHandler({
      build: await build,
      mode: 'development',
    })(request, reply);
  };
}

/** @returns {Promise<ServerBuild>} */
async function reimportServer() {
  const stat = fs.statSync(BUILD_PATH);

  // convert build path to URL for Windows compatibility with dynamic `import`
  const BUILD_URL = url.pathToFileURL(BUILD_PATH).href;

  // use a timestamp query parameter to bust the import cache
  return import(BUILD_URL + '?t=' + stat.mtimeMs);
}
