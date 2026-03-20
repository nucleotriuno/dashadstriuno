import type { Env } from '../../lib/types';

interface Account {
  id: string;
  name: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = request.headers.get('Authorization') ?? '';
  if (auth !== `Bearer ${env.SYNC_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let accounts: Account[] = [];
  try {
    accounts = JSON.parse(env.META_AD_ACCOUNTS ?? '[]');
  } catch {
    return Response.json({ error: 'Invalid META_AD_ACCOUNTS configuration' }, { status: 500 });
  }

  if (accounts.length === 0) {
    return Response.json({ error: 'No accounts configured' }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const results: Array<{ accountId: string; name: string; success: boolean; synced?: number; error?: string }> = [];

  for (const account of accounts) {
    try {
      const res = await fetch(
        `${origin}/api/sync/trigger?accountId=${encodeURIComponent(account.id)}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.SYNC_SECRET}` },
        }
      );
      const data = await res.json() as { success: boolean; synced?: number; error?: string };
      results.push({ accountId: account.id, name: account.name, ...data });
    } catch (e) {
      results.push({ accountId: account.id, name: account.name, success: false, error: 'Request failed' });
    }
  }

  const allOk = results.every((r) => r.success);
  return Response.json({ success: allOk, results }, { status: allOk ? 200 : 207 });
};
