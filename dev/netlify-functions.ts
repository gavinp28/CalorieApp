import type { IncomingMessage } from 'node:http';
import type { Plugin, ViteDevServer } from 'vite';

/**
 * Dev-only bridge: serves Netlify Functions (v2, `config.path` routing) from the
 * Vite dev server, so `npm run dev` works without the Netlify CLI. Production
 * routing is done by Netlify itself from each function's `config.path`.
 */
const FUNCTIONS: Record<string, string> = {
  '/api/puzzle': '/netlify/functions/puzzle.ts',
  '/api/unlock': '/netlify/functions/unlock.ts',
  '/api/restore-email': '/netlify/functions/restore-email.ts',
  '/api/restore-link': '/netlify/functions/restore-link.ts',
};

async function toRequest(req: IncomingMessage): Promise<Request> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  return new Request(`http://${req.headers.host ?? 'localhost'}${req.url}`, {
    method: req.method,
    headers,
    body: hasBody ? Buffer.concat(chunks) : undefined,
  });
}

export function netlifyFunctions(): Plugin {
  return {
    name: 'netlify-functions-dev',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split('?')[0] ?? '';
        const file = FUNCTIONS[path];
        if (!file) return next();
        try {
          const mod = await server.ssrLoadModule(file);
          const response: Response = await mod.default(await toRequest(req), {});
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          server.config.logger.error(String(err));
          res.statusCode = 500;
          res.end('function error');
        }
      });
    },
  };
}
