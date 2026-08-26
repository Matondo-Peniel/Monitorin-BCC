import { useEffect, useMemo, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';
import { ArrowLeft, CalendarDays, Maximize2, TrendingUp } from 'lucide-react';
import CustomSelect from './CustomSelect';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);
ChartJS.defaults.font.family = 'Inter, Arial, sans-serif';
ChartJS.defaults.color = '#0a2868';

const periodOptions = [
  { value: '7', label: '7 derniers jours', icon: CalendarDays },
  { value: '14', label: '14 derniers jours', icon: CalendarDays },
  { value: '30', label: '30 derniers jours', icon: CalendarDays },
  { value: 'all', label: 'Toutes les données', icon: TrendingUp },
];

export default function EvolutionChart({ evolution = [], period = '7', onPeriodChange }) {
  const [expanded, setExpanded] = useState(false);
  const backButtonRef = useRef(null);
  useEffect(() => {
    if (!expanded) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    backButtonRef.current?.focus();
    const closeOnEscape = event => { if (event.key === 'Escape') setExpanded(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [expanded]);
  const displayedEvolution = useMemo(() => evolution, [evolution]);
  const data = { labels: displayedEvolution.map(x=>new Date(x.date).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})), datasets: [
    { label: 'Source → Staging', data: displayedEvolution.map(x=>x.tauxStaging), borderColor: '#0874e8', backgroundColor: 'rgba(8,116,232,.08)', borderWidth: 2.5, tension: .32, pointRadius: 3.5, pointHoverRadius: 5, pointBackgroundColor: '#0874e8', pointBorderWidth: 0, clip: 0 },
    { label: 'Staging → Entrepôt', data: displayedEvolution.map(x=>x.tauxEntrepot), borderColor: '#08a76b', backgroundColor: 'rgba(8,167,107,.08)', borderWidth: 2.5, fill: 'origin', tension: .32, pointRadius: 3.5, pointHoverRadius: 5, pointBackgroundColor: '#08a76b', pointBorderWidth: 0, clip: 0 },
  ] };
  const options = { responsive: true, maintainAspectRatio: false, layout: { padding: { top: 9, right: 8, bottom: 2, left: 0 } }, plugins: { legend: { display: false } }, scales: {
    y: { min: -5, max: 105, ticks: { stepSize: 20, padding: 8, callback: value => value >= 0 && value <= 100 ? value + '%' : '' }, grid: { color: '#e9f0f7' }, border: { display: false } },
    x: { ticks: { padding: 8, maxRotation: 0, minRotation: 0 }, grid: { display: false }, border: { display: false } },
  } };

  return <section className={`card panel evolution dashboard-evolution${expanded ? ' dashboard-evolution--expanded' : ''}`} aria-label="Évolution des chargements">
    {expanded && <div className="dashboard-evolution-expanded-head">
      <button ref={backButtonRef} type="button" className="dashboard-evolution-back" onClick={() => setExpanded(false)} aria-label="Retour au tableau de bord">
        <ArrowLeft /> Retour
      </button>
      <span>Vue détaillée</span>
    </div>}
    <header className="panel-head"><div className="dashboard-evolution-title"><span><TrendingUp /></span><div><h2>Évolution des chargements</h2><p>Taux de réussite par étape</p></div></div></header>
    <CustomSelect value={period} onChange={onPeriodChange} options={periodOptions} icon={CalendarDays} ariaLabel="Période d’évolution" className="dashboard-evolution-period dashboard-evolution-period--custom" />
    <div className="dashboard-evolution-chart"><div className="chart-box"><Line key={expanded ? 'evolution-expanded' : 'evolution-compact'} data={data} options={options} /></div></div>
    <div className="evolution-legend" aria-label="Légende du graphique">
      <span><i />Source → Staging</span>
      <span className="green"><i />Staging → Entrepôt</span>
    </div>
    {!expanded && <button type="button" className="dashboard-evolution-expand" onClick={() => setExpanded(true)} aria-label="Voir l’évolution des chargements en plan grand">
      <Maximize2 /> Voir en plan grand
    </button>}
  </section>;
}
