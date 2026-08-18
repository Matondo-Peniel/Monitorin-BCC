import { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KPICard, { SplitMetric } from './components/KPICard';
import EvolutionChart from './components/EvolutionChart';
import StatusDonut from './components/StatusDonut';
import ETLFlow from './components/ETLFlow';
import LoadingTable from './components/LoadingTable';
import AlertsPanel from './components/AlertsPanel';
import AllLoadings from './components/AllLoadings';
import FluxETLPage from './components/FluxETLPage';
import ProfilePage from './components/ProfilePage';
import SettingsPage from './components/SettingsPage';
import AboutPage from './components/AboutPage';
import HistoryPage from './components/HistoryPage';
import SourcePage from './components/SourcePage';
import ModulePage from './components/ModulePage';
import RegisterUserPage from './components/InviteUserPage';
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
import './App.css';import './interactive.css';import './layout-fix.css';import './profile-fix.css';import './profile-page.css';import './settings-page.css';import './backup-settings.css';import './backup-interactive.css';import './security-settings.css';import './notification-settings.css';import './about-page.css';import './history-page.css';import './cards-polish.css';import './typography-compact.css';import './custom-icons.css';import './status-card.css';import './icon-colors.css';import './icon-placement.css';import './green-check-fix.css';import './database-align.css';import './flow-card-fix.css';import './interaction-fix.css';import './register-reference.css';import './about-icons.css';import './history-refinement.css';

function Dashboard({ onViewAll, onViewFlux, onViewAlerts, user }) {
  return <><Header user={user} /><section className="kpi-grid">
    <KPICard type="database" title="Sources chargées" progress={{ label: 'Taux de disponibilité', sub: '83 %', width: '83%' }}><div className="main-number">10 <small>sur 12</small></div></KPICard>
    <KPICard type="check" title="Source → Staging" color="green" progress={{ label: 'Taux de réussite', sub: '90 %', width: '90%' }}><SplitMetric success="9" failed="1" /></KPICard>
    <KPICard type="warehouse" title="Staging → Entrepôt" progress={{ label: 'Taux de réussite', sub: '80 %', width: '80%' }}><SplitMetric success="8" failed="2" /></KPICard>
    <KPICard type="trend" title="Taux de réussite global"><div className="global-rate"><div><Doughnut data={{ datasets: [{ data: [85, 15], backgroundColor: ['#0866e8', '#cfe4ff'], borderWidth: 0 }] }} options={{ cutout: '67%', plugins: { tooltip: { enabled: false } } }} /></div><strong>85%</strong></div><p className="rate-copy">17 / 20 chargements réussis aujourd’hui</p><p className="trend-copy">↗ +5 % vs hier</p></KPICard>
  </section><section className="middle-grid"><EvolutionChart /><StatusDonut /><ETLFlow onViewDetails={onViewFlux} /></section><section className="bottom-grid"><LoadingTable onViewAll={onViewAll} /><AlertsPanel onViewAll={onViewAlerts} /></section></>;
}

export default function App({ user, onLogout }) {
  const [active, setActive] = useState('Tableau de bord');
  const [open, setOpen] = useState(false);
  const [createdUsers, setCreatedUsers] = useState([]);
  useEffect(() => {
    const handleSecondaryActions = event => {
      if (event.target.closest('.flux-actions .top-logo')) window.scrollTo({ top: 0, behavior: 'smooth' });
      if (event.target.closest('.backup-all')) window.alert('L’historique complet des sauvegardes est déjà affiché dans cette section.');
    };
    document.addEventListener('click', handleSecondaryActions);
    return () => document.removeEventListener('click', handleSecondaryActions);
  }, []);
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
  return <div className="dashboard-app"><Sidebar user={user} onLogout={onLogout} active={showRegister ? 'Utilisateurs' : showAll ? 'Suivi des chargements' : active} setActive={setActive} open={open} setOpen={setOpen} /><main className="dashboard-main">{showRegister ? <RegisterUserPage onCancel={() => setActive('Utilisateurs')} onComplete={createdUser => { setCreatedUsers(items => [...items, createdUser]); setActive('Utilisateurs'); }} /> : showUsers ? <SettingsPage key="users-management" usersOnly onNavigate={setActive} createdUsers={createdUsers} /> : showSource ? <SourcePage onNavigate={setActive} /> : showHistory ? <HistoryPage /> : showModule ? <ModulePage type={active} /> : showAbout ? <AboutPage /> : showSettings ? <SettingsPage key="platform-settings" /> : showProfile ? <ProfilePage onNavigate={setActive} /> : showAll ? <AllLoadings onBack={() => setActive('Tableau de bord')} /> : showFlux ? <FluxETLPage onNavigate={setActive} /> : <Dashboard user={user} onViewAll={() => setActive('Tous les chargements')} onViewFlux={() => setActive('Flux ETL')} onViewAlerts={() => setActive('Alertes')} />}</main></div>;
}
