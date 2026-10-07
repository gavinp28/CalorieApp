export const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });

export class ConfigError extends Error {}

/** Reads a required environment variable (set in Netlify → Site configuration → Environment variables). */
export function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new ConfigError(`Missing environment variable ${name}`);
  return v;
}

export const optionalEnv = (name: string): string | undefined => process.env[name] || undefined;

/** Wraps a handler so config mistakes return a clear 500 instead of crashing. */
export function guard(handler: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (e) {
      console.error(e);
      return json(500, { error: e instanceof ConfigError ? 'misconfigured' : 'server_error' });
    }
  };
}

export async function readJson<T>(req: Request): Promise<Partial<T>> {
  if (req.method !== 'POST') return {};
  try {
    return (await req.json()) as Partial<T>;
  } catch {
    return {};
  }
}
