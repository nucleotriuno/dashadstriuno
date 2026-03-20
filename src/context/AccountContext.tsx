import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Account } from '../types';

interface AccountContextValue {
  accounts: Account[];
  selectedAccount: Account | null;
  setSelectedAccount: (account: Account) => void;
  isLocked: boolean;
}

const AccountContext = createContext<AccountContextValue>({
  accounts: [],
  selectedAccount: null,
  setSelectedAccount: () => {},
  isLocked: false,
});

export function AccountProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const lockedId = new URLSearchParams(window.location.search).get('account');
  const isLocked = !!lockedId;

  useEffect(() => {
    fetch('/api/accounts')
      .then((r) => r.json() as Promise<Account[]>)
      .then((list) => {
        setAccounts(list);
        if (lockedId) {
          const found = list.find((a) => a.id === lockedId);
          if (found) setSelectedAccount(found);
        } else if (list.length > 0) {
          setSelectedAccount(list[0]);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <AccountContext.Provider value={{ accounts, selectedAccount, setSelectedAccount, isLocked }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount(): AccountContextValue {
  return useContext(AccountContext);
}
