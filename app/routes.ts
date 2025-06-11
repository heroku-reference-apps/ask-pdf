import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/_index.tsx'),
  route('upload', 'routes/upload.tsx'),
  route('select', 'routes/select.tsx'),
  route('query', 'routes/query.tsx'),
  route('vector', 'routes/vector.tsx'),
] satisfies RouteConfig;
