import { Database, Search, ArrowRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Pagination from './Pagination';

export default function LoadingTable({ onViewAll, onSelect, loadings = [], title = 'Derniers chargements', pageSize = 10 }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const rows = useMemo(() => loadings.filter(row => row.source.toLowerCase().includes(query.toLowerCase())), [loadings, query]);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [page, pageSize, rows]);

  useEffect(() => { setPage(1); }, [query, loadings]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  return <section className="card table-card">
    <div className="table-head"><h2>{title}</h2><label><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Rechercher une source..." /></label></div>
    <div className="table-scroll"><table><thead><tr>{['Source','Heure','Source vers Staging','Staging vers Entrepôt','Statut'].map(column=><th key={column}>{column}</th>)}</tr></thead><tbody>{pageRows.map(row=><tr key={row.id} onClick={()=>onSelect?.(row)}><td><span className="source"><Database />{row.source}</span></td><td>{row.time}</td>{[row.staging,row.entrepot,row.status].map((value,index)=><td key={index}><span className={`badge ${value==='Échoué'?'failed':'success'}`}>{value}</span></td>)}</tr>)}</tbody></table>{!rows.length&&<div className="tracking-empty">Aucun chargement enregistré pour cette date.</div>}</div>
    {rows.length > 0 && <Pagination currentPage={page} totalPages={pageCount} totalItems={rows.length} pageSize={pageSize} itemLabel="chargement" onPageChange={setPage} />}
    {onViewAll&&<button className="text-link table-link" onClick={onViewAll}>Voir tous les chargements <ArrowRight /></button>}
  </section>;
}
