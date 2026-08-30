export const defaultGeneralPreferences = {
  background: true,
  tips: true,
  system: false,
  organization: 'Banque Centrale du Congo',
  acronym: 'BCC',
  timezone: 'kinshasa',
  language: 'fr',
  retentionDays: 365,
  connectionMode: 'read',
  refreshInterval: '5',
  reportRefresh: '00:00',
  dateFormat: 'dmy',
  theme: 'light',
  density: 'normal',
  pageSize: '25',
  homePage: 'dashboard',
};

const storageKey = 'monitoring-bcc-general-preferences';

export function readGeneralPreferences() {
  try {
    return { ...defaultGeneralPreferences, ...JSON.parse(localStorage.getItem(storageKey) || '{}') };
  } catch {
    return { ...defaultGeneralPreferences };
  }
}

export function applyGeneralPreferences(preferences) {
  const next = { ...defaultGeneralPreferences, ...preferences };
  localStorage.setItem(storageKey, JSON.stringify(next));
  document.documentElement.lang = next.language === 'en' ? 'en' : 'fr';
  document.documentElement.dataset.theme = next.theme;
  document.documentElement.dataset.density = next.density;
  document.documentElement.dataset.dateFormat = next.dateFormat;
  window.dispatchEvent(new CustomEvent('monitoring:preferences', { detail: next }));
  return next;
}

export const homePageLabel = value => ({
  dashboard: 'Tableau de bord',
  history: 'Historique',
  alerts: 'Alertes',
}[value] || 'Tableau de bord');
