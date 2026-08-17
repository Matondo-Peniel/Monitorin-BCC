import { useState } from 'react';
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
import './App.css';import './interactive.css';import './layout-fix.css';import './profile-fix.css';import './cards-polish.css';import './typography-compact.css';import './custom-icons.css';import './status-card.css';import './icon-colors.css';import './icon-placement.css';import './green-check-fix.css';import './database-align.css';import './flow-card-fix.css';

function Dashboard({ onViewAll, onViewFlux }) {
  return <><Header /><section className="kpi-grid">
    <KPICard type="database" title="Sources chargées" progress={{ label: 'Taux de disponibilité', sub: '83 %', width: '83%' }}><div className="main-number">10 <small>sur 12</small></div></KPICard>
    <KPICard type="check" title="Source → Staging" color="green" progress={{ label: 'Taux de réussite', sub: '90 %', width: '90%' }}><SplitMetric success="9" failed="1" /></KPICard>
    <KPICard type="warehouse" title="Staging → Entrepôt" progress={{ label: 'Taux de réussite', sub: '80 %', width: '80%' }}><SplitMetric success="8" failed="2" /></KPICard>
    <KPICard type="trend" title="Taux de réussite global"><div className="global-rate"><div><Doughnut data={{ datasets: [{ data: [85, 15], backgroundColor: ['#0866e8', '#cfe4ff'], borderWidth: 0 }] }} options={{ cutout: '67%', plugins: { tooltip: { enabled: false } } }} /></div><strong>85%</strong></div><p className="rate-copy">17 / 20 chargements réussis aujourd’hui</p><p className="trend-copy">↗ +5 % vs hier</p></KPICard>
  </section><section className="middle-grid"><EvolutionChart /><StatusDonut /><ETLFlow onViewDetails={onViewFlux} /></section><section className="bottom-grid"><LoadingTable onViewAll={onViewAll} /><AlertsPanel /></section></>;
}

export default function App() {
  const [active, setActive] = useState('Tableau de bord');
  const [open, setOpen] = useState(false);
  const showAll = active === 'Tous les chargements' || active === 'Suivi des chargements';
  const showFlux = active === 'Flux ETL';
  return <div className="dashboard-app"><Sidebar active={showAll ? 'Suivi des chargements' : active} setActive={setActive} open={open} setOpen={setOpen} /><main className="dashboard-main">{showAll ? <AllLoadings onBack={() => setActive('Tableau de bord')} /> : showFlux ? <FluxETLPage onNavigate={setActive} /> : <Dashboard onViewAll={() => setActive('Tous les chargements')} onViewFlux={() => setActive('Flux ETL')} />}</main></div>;
}
