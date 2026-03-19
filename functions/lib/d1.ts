import type { Env } from './types';

export function getDB(env: Env): D1Database {
  return env.DB;
}
