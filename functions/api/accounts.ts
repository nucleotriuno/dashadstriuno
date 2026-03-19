import type { Env } from '../lib/types';

interface Account {
  id: string;
  name: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const accounts: Account[] = JSON.parse(env.META_AD_ACCOUNTS ?? '[]');
    return Response.json(accounts);
  } catch {
    return Response.json([], { status: 200 });
  }
};
