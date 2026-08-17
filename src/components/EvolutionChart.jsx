import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';
import { evolution } from '../data/dashboardData';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);
ChartJS.defaults.font.family = 'Inter, Arial, sans-serif';
ChartJS.defaults.color = '#0a2868';

export default function EvolutionChart() {
  const data = { labels: evolution.labels, datasets: [
    { label: 'Source → Staging', data: evolution.staging, borderColor: '#0866e8', backgroundColor: '#0866e8', tension: .25, pointRadius: 3 },
    { label: 'Staging → Entrepôt', data: evolution.warehouse, borderColor: '#18a558', backgroundColor: 'rgba(169,182,200,.14)', fill: 'origin', tension: .25, pointRadius: 3, pointBackgroundColor: '#18a558' },
  ] };
  const options = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: {
    y: { min: 0, max: 100, ticks: { callback: value => value + '%' }, grid: { color: '#e9f0f7' }, border: { display: false } },
    x: { grid: { display: false }, border: { display: false } },
  } };

  return <section className="card panel evolution">
    <div className="panel-head"><h2>Évolution des chargements</h2><select><option>7 derniers jours</option></select></div>
    <div className="chart-box"><Line data={data} options={options} /></div>
    <div className="evolution-legend" aria-label="Légende du graphique">
      <span><i />Source → Staging</span>
      <span className="green"><i />Staging → Entrepôt</span>
    </div>
  </section>;
}
