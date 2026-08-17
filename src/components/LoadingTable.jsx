import { Database, Search, ArrowRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { loadings } from '../data/dashboardData';

export default function LoadingTable({ onViewAll }) {
  const [query, setQuery] = useState('');
  const rows = useMemo(() => loadings.filter(row => row[0].toLowerCase().includes(query.toLowerCase())), [query]);
  return <section className="card table-card">
    <div className="table-head"><h2>Détail des chargements du 14 mai 2025</h2><label><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Rechercher une source..." /></label></div>
    <div className="table-scroll"><table><thead><tr>{['Source', 'Heure de début', 'Source → Staging', 'Staging → Entrepôt', 'Durée', 'Statut'].map(title => <th key={title}>{title}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row[0]}>{row.map((value, index) => <td key={index}>{index === 0 ? <span className="source"><Database />{value}</span> : index === 2 || index === 3 || index === 5 ? <span className={`badge ${value === 'Réussi' ? 'success' : 'failed'}`}>{value}</span> : value}</td>)}</tr>)}</tbody></table></div>
    <button className="text-link table-link" onClick={onViewAll}>Voir tous les chargements <ArrowRight /></button>
  </section>;
}
