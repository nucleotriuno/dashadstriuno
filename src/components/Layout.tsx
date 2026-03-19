import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

export function Layout() {
  const [accountName, setAccountName] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ account: { name: string } | null }>('/api/metrics/financeiro')
      .then((data) => setAccountName(data.account?.name ?? null))
      .catch(() => null);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar accountName={accountName} />
      <main style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
