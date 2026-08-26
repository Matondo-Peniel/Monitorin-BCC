import { X } from 'lucide-react';

export default function AlertsPanel({ onViewAll, alerts = [] }) {
  return <section className="card alerts-panel">
    <div className="alerts-head"><h2>Alertes & notifications</h2><button className="text-link" onClick={onViewAll}>Voir tout</button></div>
    {alerts.map(item=><article key={item.idAlerte} onClick={onViewAll} role="button" tabIndex="0">
      <span className={item.niveau==='CRITIQUE'?'danger':'information'}>{item.niveau==='CRITIQUE'?<X/>:<strong className="alert-mark">!</strong>}</span>
      <div><b>{item.message}</b><small>{item.etape}</small></div>
      <time>{new Date(item.dateHeureAlerte).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</time>
    </article>)}
    {!alerts.length&&<div className="tracking-empty">Aucune alerte enregistrée</div>}
  </section>;
}
