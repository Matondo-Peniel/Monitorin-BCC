import { useCallback, useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
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
import DashboardsPage from './components/DashboardsPage';
import ProfilePage from './components/ProfilePage';
import SettingsPage from './components/SettingsPage';
import AboutPage from './components/AboutPage';
import HistoryPage from './components/HistoryPage';
import SourcePage from './components/SourcePage';
import ModulePage from './components/ModulePage';
import RegisterUserPage from './components/InviteUserPage';
import { ActiveDateProvider, useActiveDate } from './active-date';
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
import './dashboards-page.css';
import './tracking-kpis-modern.css';
import './settings-runtime.css';
import './refresh-unification.css';
import './backup-v2.css';
import './history-custom-range.css';
import './tracking-alert-kpis.css';
import './pagination-common.css';
import './flux-detail-panel.css';
import './source-configurator.css';

const formatDate = value => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`));

function Dashboard({ onViewAll, onViewFlux, onViewAlerts, user, preferences }) {
  const { activeDate } = useActiveDate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [evolutionPeriod, setEvolutionPeriod] = useState('7');
  const load = useCallback(async () => {
    setRefreshing(true);
    setError('');
    try {
      const nextData = await api.dashboard(activeDate, evolutionPeriod);
      setData(nextData);
      return nextData;
    } catch (exception) {
      setError(exception.message);
      throw exception;
    } finally {
      setRefreshing(false);
    }
  }, [activeDate, evolutionPeriod]);

  useEffect(() => { load().catch(() => {}); }, [load]);
  useEffect(() => {
    const minutes = Number(preferences.refreshInterval);
    if (!preferences.background || !minutes) return undefined;
    const timer = window.setInterval(() => load().catch(() => {}), minutes * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [load, preferences.background, preferences.refreshInterval]);

  if (error && !data) return <><Header user={user} onRefresh={load} refreshing={refreshing} /><section className="card tracking-empty">Impossible de charger les données : {error}</section></>;
  if (!data) return <><Header user={user} onRefresh={load} refreshing={refreshing} /><section className="card tracking-empty">Chargement des données de la base…</section></>;
  const metrics = data.metrics;
  const rows = data.sources.filter(source => source.latest).map(source => ({
    id: source.latest.id,
    source: source.nomConnexion,
    time: new Date(source.latest.dateHeureETL).toLocaleTimeString('fr-FR'),
    staging: source.latest.staging ? 'Réussi' : 'Échoué',
    entrepot: source.latest.entrepot ? 'Réussi' : 'Échoué',
    status: source.latest.staging && source.latest.entrepot ? 'Réussi' : 'Échoué',
  }));

  return <><Header user={user} onRefresh={load} refreshing={refreshing} />{error && <section className="card tracking-empty">Impossible d’actualiser les données : {error}</section>}<section className="kpi-grid">
    <KPICard type="database" title="Sources chargées" progress={{ label: 'Taux de disponibilité', sub: `${metrics.loadedSources} / ${metrics.activeSources}`, width: `${metrics.activeSources ? metrics.loadedSources * 100 / metrics.activeSources : 0}%` }}><div className="main-number">{metrics.loadedSources} <small>sur {metrics.activeSources}</small></div></KPICard>
    <KPICard type="check" title="Source → Staging" color="green" progress={{ label: 'Taux de réussite', sub: `${metrics.stagingRate} %`, width: `${metrics.stagingRate}%` }}><SplitMetric success={metrics.stagingSuccess} failed={metrics.stagingFailed} /></KPICard>
    <KPICard type="warehouse" title="Staging → Entrepôt" progress={{ label: 'Taux de réussite', sub: `${metrics.warehouseRate} %`, width: `${metrics.warehouseRate}%` }}><SplitMetric success={metrics.warehouseSuccess} failed={metrics.warehouseFailed} /></KPICard>
    <KPICard type="trend" title="Taux de réussite global"><div className="global-rate"><div><Doughnut data={{ datasets: [{ data: [metrics.globalRate, 100 - metrics.globalRate], backgroundColor: ['#0866e8', '#cfe4ff'], borderWidth: 0 }] }} options={{ cutout: '67%', plugins: { tooltip: { enabled: false } } }} /></div><strong>{metrics.globalRate}%</strong></div><p className="rate-copy">{metrics.total} chargement(s) le {formatDate(activeDate)}</p></KPICard>
  </section><section className="middle-grid"><EvolutionChart evolution={data.evolution} period={evolutionPeriod} onPeriodChange={setEvolutionPeriod} /><StatusDonut metrics={metrics} /><ETLFlow onViewDetails={onViewFlux} metrics={metrics} /></section><section className="bottom-grid"><LoadingTable onViewAll={onViewAll} loadings={rows} /><AlertsPanel onViewAll={onViewAlerts} alerts={data.alerts} /></section></>;
}

function AppContent({ user, onLogout, onUserUpdate }) {
  const [preferences, setPreferences] = useState(readGeneralPreferences);
  const [active, setActive] = useState(() => homePageLabel(readGeneralPreferences().homePage));
  const [open, setOpen] = useState(false);
  const [createdUsers, setCreatedUsers] = useState([]);
  const showAll = active === 'Tous les chargements' || active === 'Suivi des chargements';
  const showFlux = active === 'Flux ETL';
  const showDashboards = active === 'Tableaux de bord';
  const showProfile = active === 'Mon profil';
  const showSettings = active === 'Paramètres';
  const showAbout = active === 'À propos';
  const showHistory = active === 'Historique';
  const showSource = active === 'Sources' || active === 'Source';
  const showUsers = active === 'Utilisateurs';
  const showModule = active === 'Alertes' || active === 'Rapports';
  const showRegister = active === 'Enregistrer un utilisateur';
  useEffect(() => {
    api.preferences().then(result => setPreferences(applyGeneralPreferences(result.general || defaultGeneralPreferences))).catch(() => {});
    const update = event => setPreferences(event.detail);
    window.addEventListener('monitoring:preferences', update);
    return () => window.removeEventListener('monitoring:preferences', update);
  }, []);
  return <div className="dashboard-app"><Sidebar user={user} onLogout={onLogout} active={showRegister ? 'Utilisateurs' : showAll ? 'Suivi des chargements' : active} setActive={setActive} open={open} setOpen={setOpen} /><main className="dashboard-main">{showRegister ? <RegisterUserPage onCancel={() => setActive('Utilisateurs')} onComplete={createdUser => { setCreatedUsers(items => [...items, createdUser]); setActive('Utilisateurs'); }} /> : showUsers ? <SettingsPage key="users-management" usersOnly onNavigate={setActive} currentUser={user} onUserUpdate={onUserUpdate} /> : showSource ? <SourcePage onNavigate={setActive} /> : showHistory ? <HistoryPage /> : showModule ? <ModulePage type={active} user={user} /> : showAbout ? <AboutPage /> : showSettings ? <SettingsPage key="platform-settings" /> : showProfile ? <ProfilePage user={user} onUserUpdate={onUserUpdate} /> : showAll ? <AllLoadings onBack={() => setActive('Tableau de bord')} /> : showDashboards ? <DashboardsPage onNavigate={setActive} /> : showFlux ? <FluxETLPage onNavigate={setActive} /> : <Dashboard user={user} preferences={preferences} onViewAll={() => setActive('Tous les chargements')} onViewFlux={() => setActive('Flux ETL')} onViewAlerts={() => setActive('Alertes')} />}</main></div>;
}

export default function App({ user, onLogout, onUserUpdate }) {
  return <ActiveDateProvider><AppContent user={user} onLogout={onLogout} onUserUpdate={onUserUpdate} /></ActiveDateProvider>;
}
