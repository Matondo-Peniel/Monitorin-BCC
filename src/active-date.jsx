import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { localDate } from './date';

const storageKey = 'monitoring-etl-active-date';
const ActiveDateContext = createContext(null);

const isIsoDate = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));

const initialDate = () => {
  try {
    const stored = window.sessionStorage.getItem(storageKey);
    return isIsoDate(stored) ? stored : localDate();
  } catch {
    return localDate();
  }
};

export function ActiveDateProvider({ children }) {
  const [activeDate, setActiveDate] = useState(initialDate);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(storageKey, activeDate);
    } catch {
      // The application remains usable when browser storage is unavailable.
    }
  }, [activeDate]);

  const value = useMemo(() => ({ activeDate, setActiveDate }), [activeDate]);
  return <ActiveDateContext.Provider value={value}>{children}</ActiveDateContext.Provider>;
}

export function useActiveDate() {
  const context = useContext(ActiveDateContext);
  if (!context) throw new Error('useActiveDate doit être utilisé dans ActiveDateProvider.');
  return context;
}
