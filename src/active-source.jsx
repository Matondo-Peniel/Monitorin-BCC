import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';

const ActiveSourceContext = createContext(null);
const storageKey = 'monitoring-etl-selected-source';
const isDemoSource = source => /démonstration|demonstration/i.test(source?.nomConnexion || '') || /(^|[-_])demo($|[-_])/i.test(source?.nomServeur || '');

export function ActiveSourceProvider({ children }) {
  const [sources, setSources] = useState([]);
  const [sourceId, setSourceId] = useState(() => window.sessionStorage.getItem(storageKey) || '');
  const [loading, setLoading] = useState(true);

  const refreshSources = async () => {
    setLoading(true);
    try {
      const items = (await api.sources() || []).filter(source => !isDemoSource(source));
      setSources(items);
      setSourceId(current => String(items.some(item => String(item.idConnexion) === String(current)) ? current : ''));
    } finally { setLoading(false); }
  };
  useEffect(() => { refreshSources().catch(() => setLoading(false)); }, []);
  useEffect(() => { if (sourceId) window.sessionStorage.setItem(storageKey, sourceId); }, [sourceId]);
  const value = useMemo(() => ({ sources, sourceId, setSourceId, loading, refreshSources, source: sources.find(item => String(item.idConnexion) === String(sourceId)) || null }), [sources, sourceId, loading]);
  return <ActiveSourceContext.Provider value={value}>{children}</ActiveSourceContext.Provider>;
}

export function useActiveSource() {
  const context = useContext(ActiveSourceContext);
  if (!context) throw new Error('useActiveSource doit être utilisé dans ActiveSourceProvider.');
  return context;
}
