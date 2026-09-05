import { useCallback, useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Database, Settings2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KPICard, { SplitMetric } from './components/KPICard';
import EvolutionChart from './components/EvolutionChart';
import StatusDonut from './components/StatusDonut';
import ETLFlow from './components/ETLFlow';
import LoadingTable from './components/LoadingTable';
import AlertsPanel from './components/AlertsPanel';
import { api } from './api';
import AllLoadings from './components/AllLoadings';
import FluxETLPage from './components/FluxETLPage';
import ProfilePage from './components/ProfilePage';
import SettingsPage from './components/SettingsPage';
import AboutPage from './components/AboutPage';
import HistoryPage from './components/HistoryPage';
import SourcePage from './components/SourcePage';
import ModulePage from './components/ModulePage';
import ValidationPage from './components/ValidationPage';
import RegisterUserPage from './components/InviteUserPage';
import { ActiveDateProvider, useActiveDate } from './active-date';
import { ActiveSourceProvider, useActiveSource } from './active-source';
import { applyGeneralPreferences, defaultGeneralPreferences, homePageLabel, readGeneralPreferences } from './preferences';
import './source-page.css';
import './register-user.css';
import './register-role-step.css';
import './general-settings.css';
import './module-page.css';
import './alerts-header-enhanced.css';
import './alert-modal-v2.css';
import './unified-controls.css';
import './page-size-options.css';
import './card-click-reset.css';
import './unified-pagination.css';
import './alert-category-pages.css';
import './alert-header-spacing.css';
import './source-icons-refined.css';
import './frontend-finalization.css';
import './ui-quality.css';
import './App.css';
import './interactive.css';
import './layout-fix.css';
import './profile-fix.css';
import './profile-page.css';
import './settings-page.css';
import './backup-settings.css';
import './backup-interactive.css';
import './security-settings.css';
import './notification-settings.css';
import './about-page.css';
import './about-contact-details.css';
import './history-page.css';
import './cards-polish.css';
import './custom-icons.css';
import './status-card.css';
import './icon-colors.css';
import './icon-placement.css';
import './green-check-fix.css';
import './database-align.css';
import './flow-card-fix.css';
import './interaction-fix.css';
import './register-reference.css';
import './about-icons.css';
import './history-refinement.css';
import './visual-restoration.css';
import './monitoring-ui.css';
import './invite-wizard.css';
import './custom-select.css';
import './settings-user-modal.css';
import './profile-v2.css';
import './profile-activity-refinement.css';
import './settings-filter-toolbar.css';
import './settings-controls-modern.css';
import './sidebar-redesign.css';
import './ui-card-unification.css';
import './dashboard-evolution.css';
import './history-controls-refinement.css';
import './dashboard-card-refinement.css';
import './settings-tracking-refinement.css';
import './invite-general-refinement.css';
import './alert-filter-refinement.css';
import './user-management-actions.css';
import './tracking-kpis-modern.css';
import './settings-runtime.css';
import './refresh-unification.css';
import './backup-v2.css';
import './history-custom-range.css';
import './tracking-alert-kpis.css';
import './pagination-common.css';
import './flux-detail-panel.css';
import './source-configurator.css';
import './source-configuration-prompt.css';
import './dashboard-kpi-fix.css';

const formatDate = value => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
const routeByPage = {
  'Tableau de bord': '/dashboard', 'Suivi des chargements': '/suivi', 'Tous les chargements': '/suivi',
  'Flux ETL': '/flux-etl', Sources: '/sources', Historique: '/historique', Alertes: '/alertes',
  Rapports: '/rapports', Paramètres: '/parametres', Utilisateurs: '/utilisateurs',
  'Enregistrer un utilisateur': '/utilisateurs/nouveau', 'Mon profil': '/profil', 'À propos': '/a-propos',
  'Validation des données': '/validation',
};
const pageByRoute = Object.fromEntries(Object.entries(routeByPage).map(([page, route]) => [route, page]));
pageByRoute['/tableaux-de-bord'] = 'Tableau de bord';
const appBasePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const pageFromLocation = fallback => {
  const pathname = window.location.pathname.startsWith(appBasePath) ? window.location.pathname.slice(appBasePath.length) || '/' : window.location.pathname;
  return pageByRoute[pathname] || fallback;
};

function Dashboard({ onViewAll, onViewFlux, onViewAlerts, user, preferences }) {
  const { activeDate } = useActiveDate();
  const { sourceId } = useActiveSource();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [evolutionPeriod, setEvolutionPeriod] = useState('7');
  const load = useCallback(async () => {
    setRefreshing(true);
    setError('');
    try {
      if (!sourceId) return null;
      const nextData = await api.dashboard(activeDate, evolutionPeriod, sourceId);
      setData(nextData);
      return nextData;
    } catch (exception) {
      setError(exception.message);
      throw exception;
    } finally {
      setRefreshing(false);
    }
  }, [activeDate, evolutionPeriod, sourceId]);

  useEffect(() => { if (sourceId) load().catch(() => {}); }, [load, sourceId]);
  useEffect(() => {
    const minutes = Number(preferences.refreshInterval);
    if (!preferences.background || !minutes) return undefined;
    const timer = window.setInterval(() => load().catch(() => {}), minutes * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [load, preferences.background, preferences.refreshInterval]);

  if (!sourceId) return <><Header user={user} onRefresh={load} refreshing={refreshing} /><section className="card tracking-empty">Aucune source configurée. Configurez une source dans la page Sources avant d’afficher les données.</section></>;
  if (error && !data) return <><Header user={user} onRefresh={load} refreshing={refreshing} /><section className="card tracking-empty">Impossible de charger les données : {error}</section></>;
  if (!data) return <><Header user={user} onRefresh={load} refreshing={refreshing} /><section className="card tracking-empty">Chargement des données de la base…</section></>;
  const metrics = data.metrics;
  const rows = (data.recentLoadings || []).map(loading => ({
    id: loading.id,
    source: loading.source,
    time: new Date(loading.dateHeureETL).toLocaleTimeString('fr-FR'),
    staging: loading.staging ? 'Réussi' : 'Échoué',
    entrepot: loading.entrepot ? 'Réussi' : 'Échoué',
    status: loading.staging && loading.entrepot ? 'Réussi' : 'Échoué',
  }));

  return <><Header user={user} onRefresh={load} refreshing={refreshing} />{error && <section className="card tracking-empty">Impossible d’actualiser les données : {error}</section>}<section className="kpi-grid">
    <KPICard type="database" title="Sources chargées" progress={{ label: 'Taux de disponibilité', sub: `${metrics.loadedSources} / ${metrics.activeSources}`, width: `${metrics.activeSources ? metrics.loadedSources * 100 / metrics.activeSources : 0}%` }}><div className="main-number">{metrics.loadedSources} <small>sur {metrics.activeSources}</small></div></KPICard>
    <KPICard type="check" title="Source → Staging" color="green" progress={{ label: 'Taux de réussite', sub: `${metrics.stagingRate} %`, width: `${metrics.stagingRate}%` }}><SplitMetric success={metrics.stagingSuccess} failed={metrics.stagingFailed} /></KPICard>
    <KPICard type="warehouse" title="Staging → Entrepôt" progress={{ label: 'Taux de réussite', sub: `${metrics.warehouseRate} %`, width: `${metrics.warehouseRate}%` }}><SplitMetric success={metrics.warehouseSuccess} failed={metrics.warehouseFailed} /></KPICard>
    <KPICard type="trend" title="Taux de réussite global"><div className="global-rate global-rate--kpi"><div><Doughnut data={{ datasets: [{ data: [metrics.globalRate, 100 - metrics.globalRate], backgroundColor: ['#0866e8', '#cfe4ff'], borderWidth: 0 }] }} options={{ cutout: '67%', plugins: { tooltip: { enabled: false } } }} /></div><strong>{metrics.globalRate}%</strong></div><p className="rate-copy">{metrics.total} chargement(s) le {formatDate(activeDate)}</p></KPICard>
  </section><section className="middle-grid"><EvolutionChart evolution={data.evolution} period={evolutionPeriod} onPeriodChange={setEvolutionPeriod} /><StatusDonut metrics={metrics} /><ETLFlow onViewDetails={onViewFlux} metrics={metrics} /></section><section className="bottom-grid"><LoadingTable onViewAll={onViewAll} loadings={rows} /><AlertsPanel onViewAll={onViewAlerts} alerts={data.alerts} /></section></>;
}

function AppContent({ user, onLogout, onUserUpdate }) {
  const isAdministrator = Boolean(user?.roles?.includes('ADMINISTRATEUR'));
  const { sourceId, loading: loadingSources } = useActiveSource();
  const [preferences, setPreferences] = useState(readGeneralPreferences);
  const [active, setActive] = useState(() => pageFromLocation(homePageLabel(readGeneralPreferences().homePage)));
  const [open, setOpen] = useState(false);
  const [createdUsers, setCreatedUsers] = useState([]);
  const showAll = active === 'Tous les chargements' || active === 'Suivi des chargements';
  const showFlux = active === 'Flux ETL';
  const showProfile = active === 'Mon profil';
  const showSettings = active === 'Paramètres';
  const showAbout = active === 'À propos';
  const showHistory = active === 'Historique';
  const showSource = active === 'Sources' || active === 'Source';
  const showUsers = active === 'Utilisateurs';
  const showModule = active === 'Alertes' || active === 'Rapports';
  const showRegister = active === 'Enregistrer un utilisateur';
  const showValidation = active === 'Validation des données';
  const isTrackingPage = !showSource && !showUsers && !showRegister && !showSettings && !showProfile && !showAbout && !showValidation;
  useEffect(() => {
    api.preferences().then(result => setPreferences(applyGeneralPreferences(result.general || defaultGeneralPreferences))).catch(() => {});
    const update = event => setPreferences(event.detail);
    window.addEventListener('monitoring:preferences', update);
    return () => window.removeEventListener('monitoring:preferences', update);
  }, []);
  useEffect(() => {
    const onPopState = () => setActive(pageFromLocation(homePageLabel(readGeneralPreferences().homePage)));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  const navigate = next => {
    const route = routeByPage[next] || '/dashboard';
    const href = `${appBasePath}${route}`;
    if (window.location.pathname !== href) window.history.pushState({}, '', href);
    setActive(next);
  };
  if (showSource && !isAdministrator) return <div className="dashboard-app"><Sidebar user={user} onLogout={onLogout} active={active} setActive={navigate} open={open} setOpen={setOpen} /><main className="dashboard-main"><section className="ui-page"><section className="ui-panel tracking-empty"><h1>Accès réservé à l’administrateur</h1><p>La configuration des Sources SQL Server est réservée à l’administrateur. Vous pouvez continuer vos analyses à partir du tableau de bord.</p></section></section></main></div>;
  if ((showUsers || showRegister) && !isAdministrator) return <div className="dashboard-app"><Sidebar user={user} onLogout={onLogout} active={active} setActive={navigate} open={open} setOpen={setOpen} /><main className="dashboard-main"><section className="ui-page"><section className="ui-panel tracking-empty"><h1>Accès réservé à l’administrateur</h1><p>La gestion des utilisateurs, des rôles et des invitations est réservée à l’administrateur.</p></section></section></main></div>;
  if (showValidation) return <div className="dashboard-app"><Sidebar user={user} onLogout={onLogout} active={active} setActive={navigate} open={open} setOpen={setOpen} /><main className="dashboard-main"><ValidationPage user={user} /></main></div>;
  if (isTrackingPage && loadingSources) return <div className="dashboard-app"><Sidebar user={user} onLogout={onLogout} active={active} setActive={navigate} open={open} setOpen={setOpen} /><main className="dashboard-main"><SourceConfigurationPrompt loading /></main></div>;
  if (isTrackingPage && !sourceId) return <div className="dashboard-app"><Sidebar user={user} onLogout={onLogout} active={active} setActive={navigate} open={open} setOpen={setOpen} /><main className="dashboard-main"><SourceConfigurationPrompt onConfigure={isAdministrator ? () => navigate('Sources') : undefined} /></main></div>;
  return <div className="dashboard-app"><Sidebar user={user} onLogout={onLogout} active={showRegister ? 'Utilisateurs' : showAll ? 'Suivi des chargements' : active} setActive={navigate} open={open} setOpen={setOpen} /><main className="dashboard-main">{showRegister ? <RegisterUserPage onCancel={() => navigate('Utilisateurs')} onComplete={createdUser => { setCreatedUsers(items => [...items, createdUser]); navigate('Utilisateurs'); }} /> : showUsers ? <SettingsPage key="users-management" usersOnly onNavigate={navigate} currentUser={user} onUserUpdate={onUserUpdate} /> : showSource ? <SourcePage onNavigate={navigate} user={user} /> : showHistory ? <HistoryPage /> : showModule ? <ModulePage type={active} user={user} /> : showAbout ? <AboutPage /> : showSettings ? <SettingsPage key="platform-settings" /> : showProfile ? <ProfilePage user={user} onUserUpdate={onUserUpdate} /> : showAll ? <AllLoadings onBack={() => navigate('Tableau de bord')} /> : showFlux ? <FluxETLPage onNavigate={navigate} /> : <Dashboard user={user} preferences={preferences} onViewAll={() => navigate('Tous les chargements')} onViewFlux={() => navigate('Flux ETL')} onViewAlerts={() => navigate('Alertes')} />}</main></div>;
}

function SourceConfigurationPrompt({ loading = false, onConfigure }) {
  if (loading) return <section className="source-configuration-prompt source-configuration-prompt--loading" aria-live="polite"><span className="source-configuration-prompt__loader" /><p>Vérification de la configuration des sources…</p></section>;
  return <section className="source-configuration-prompt"><div className="source-configuration-prompt__icon"><Database aria-hidden="true" /></div><div className="source-configuration-prompt__content"><p className="source-configuration-prompt__eyebrow">Suivi des chargements</p><h1>Une source est nécessaire pour commencer</h1><p>{onConfigure ? 'Connectez d’abord la table SQL Server qui contient les exécutions ETL. Les tableaux de bord, alertes, historiques et flux seront alors disponibles.' : 'La source de suivi doit être configurée par un administrateur avant que les données soient disponibles.'}</p>{onConfigure && <><div className="source-configuration-prompt__steps" aria-label="Étapes de configuration"><span><b>1</b>Choisir la base</span><span><b>2</b>Sélectionner la table</span><span><b>3</b>Activer le suivi</span></div><button className="ui-button ui-button--primary" type="button" onClick={onConfigure}><Settings2 />Configurer une source</button></>}</div></section>;
}

export default function App({ user, onLogout, onUserUpdate }) {
  return <ActiveSourceProvider><ActiveDateProvider><AppContent user={user} onLogout={onLogout} onUserUpdate={onUserUpdate} /></ActiveDateProvider></ActiveSourceProvider>;
}
