import { X } from 'lucide-react';
import { alerts } from '../data/dashboardData';

export default function AlertsPanel() {
  return <section className="card alerts-panel">
    <div className="alerts-head">
      <h2>Alertes & notifications</h2>
      <button className="text-link" onClick={() => alert('Toutes les alertes')}>Voir tout</button>
    </div>
    {alerts.map(item => <article key={item.title} onClick={() => alert(`${item.title}\n${item.sub}\n${item.time}`)}>
      <span className={item.danger ? 'danger' : 'information'}>
        {item.danger ? <X /> : <strong className="alert-mark">!</strong>}
      </span>
      <div><b>{item.title}</b><small>{item.sub}</small></div>
      <time>{item.time}</time>
    </article>)}
  </section>;
}
