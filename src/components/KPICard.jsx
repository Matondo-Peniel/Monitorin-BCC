import { Database, Check, Warehouse, TrendingUp, X } from 'lucide-react';

const iconMap = { database: Database, check: Check, warehouse: Warehouse, trend: TrendingUp };
const imageMap = { warehouse: '/icons/data-warehouse.png' };

export default function KPICard({ type, title, children, progress, color = 'blue' }) {
  const Icon = iconMap[type];
  const image = imageMap[type];
  return <article className="card kpi-card">
    <div className={`kpi-icon ${color}`}>{image ? <img src={image} alt="" /> : <Icon />}</div>
    <div className="kpi-body"><h3>{title}</h3>{children}</div>
    {progress && <footer><b>{progress.label}</b><small>{progress.sub}</small><i><span style={{ width: progress.width }} /></i></footer>}
  </article>;
}

export function SplitMetric({ success, failed }) {
  return <div className="split-metric"><span><strong>{success}</strong><small>Réussis</small></span><span><strong>{failed}</strong><small><X /> Échoués</small></span></div>;
}
