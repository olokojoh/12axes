// Minimal ambient declarations for the Cloudflare Worker runtime so that a
// standalone `tsc --noEmit` succeeds; the vinext build injects the real
// runtime types. Replace with `@cloudflare/workers-types` once dependency
// changes are on the table.

declare module "cloudflare:workers" {
  export const env: {
    DB?: D1Database;
    [binding: string]: unknown;
  };
}

declare interface Fetcher {
  fetch(input: Request | string | URL, init?: RequestInit): Promise<Response>;
}

declare interface D1Database {
  prepare(query: string): unknown;
  batch(statements: unknown[]): Promise<unknown[]>;
  exec(query: string): Promise<unknown>;
}
