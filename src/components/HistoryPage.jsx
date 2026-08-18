import { useEffect, useMemo, useState } from 'react';
import { Chart as ChartJS, ArcElement, CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { CalendarDays, Check, ChevronDown, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Clock3, Database, Download, Filter, Landmark, Search, X } from 'lucide-react';
import bccLogo from '../assets/bcc-logo.png';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const records = [
  ['14/05/2025',1,true,1,true,'Réussi','00:03:21','07:31:56'],['13/05/2025',1,true,0,false,'Partiel','00:02:15','07:30:42'],['12/05/2025',1,true,1,true,'Réussi','00:03:02','07:29:18'],['11/05/2025',0,false,0,false,'Échec','00:01:47','—'],['10/05/2025',1,true,1,true,'Réussi','00:02:58','07:27:33'],
  ['09/05/2025',1,true,1,true,'Réussi','00:03:11','07:26:20'],['08/05/2025',1,true,0,false,'Partiel','00:02:42','07:25:41'],['07/05/2025',1,true,1,true,'Réussi','00:03:08','07:24:18'],['06/05/2025',1,true,1,true,'Réussi','00:03:15','07:23:06'],['05/05/2025',1,true,1,true,'Réussi','00:02:54','07:22:30'],
  ['04/05/2025',1,true,1,true,'Réussi','00:03:04','07:21:52'],['03/05/2025',1,true,0,false,'Partiel','00:02:33','07:20:45'],['02/05/2025',1,true,1,true,'Réussi','00:03:20','07:19:39'],['01/05/2025',1,true,1,true,'Réussi','00:03:07','07:18:25'],
];

const labels = ['01/05','02/05','03/05','04/05','05/05','06/05','07/05','08/05','09/05','10/05','11/05','12/05','13/05','14/05'];
const donutPercentPlugin = { id:'historyDonutPercent', afterDatasetsDraw(chart) { const { ctx } = chart; const values = chart.data.datasets[0].data; ctx.save(); ctx.fillStyle='#fff'; ctx.font='700 11px Inter, Arial'; ctx.textAlign='center'; ctx.textBaseline='middle'; chart.getDatasetMeta(0).data.forEach((arc,index) => { const point=arc.tooltipPosition(); ctx.fillText(`${String(values[index]).replace('.',',')}%`,point.x,point.y); }); ctx.restore(); } };

export default function HistoryPage() {
  const [rangeOpen, setRangeOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [status, setStatus] = useState('Tous');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    if (!selected) return undefined;
    const closeOnEscape = event => event.key === 'Escape' && setSelected(null);
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [selected]);
  const filtered = useMemo(() => records.filter(row => row[0].includes(query) && (status === 'Tous' || row[5] === status)), [query, status]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const shown = filtered.slice((page - 1) * pageSize, page * pageSize);
  const exportCsv = () => { const csv = ['Date,Staging,Statut Staging,DW,Statut DW,Statut global,Durée,Heure', ...filtered.map(r => [r[0],r[1],r[2]?'Réussi':'Échec',r[3],r[4]?'Réussi':'Échec',r[5],r[6],r[7]].join(','))].join('\n'); const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = 'historique-chargements.csv'; link.click(); URL.revokeObjectURL(link.href); };
  const lineData = { labels, datasets: [{ label:'Staging', data:[80,85,80,89,89,96,90,92,83,87,82,80,93,80], borderColor:'#0866e8', backgroundColor:'#0866e8', borderWidth:2, tension:.32, pointRadius:4, pointHoverRadius:5 }, { label:'DW', data:[64,67,40,55,67,54,40,62,54,66,55,39,57,58], borderColor:'#12a257', backgroundColor:'#12a257', borderWidth:2, tension:.32, pointRadius:4, pointHoverRadius:5 }] };
  const lineOptions = { responsive:true, maintainAspectRatio:false, interaction:{intersect:false,mode:'index'}, layout:{padding:{top:4,right:4,left:0,bottom:0}}, plugins:{ legend:{ display:false } }, scales:{ y:{ min:0,max:100,border:{display:false},ticks:{stepSize:25,padding:10,color:'#063b9b',font:{size:10},callback:v=>`${v}%`},grid:{color:'#dfe9f4',lineWidth:1} }, x:{border:{display:false},ticks:{color:'#063b9b',font:{size:10},maxRotation:0},grid:{display:false}} } };
  const donutData = { labels:['Réussi','Partiel','Échec'], datasets:[{ data:[61.5,23.1,15.4], backgroundColor:['#16a052','#f43f45','#abb7ca'], borderWidth:0 }] };
  return <div className="history-page">
    <header className="history-header"><div><h1>Historique des chargements</h1><p>Consultez l’historique des processus ETL (Staging et Data Warehouse)</p></div><div className="history-head-actions"><div className="history-range-wrap"><button className={rangeOpen?'active':''} onClick={()=>{setRangeOpen(!rangeOpen);setFiltersOpen(false)}}><CalendarDays /><span><small>Période</small><b>01 mai 2025 — 14 mai 2025</b></span><ChevronDown className={rangeOpen?'open':''}/></button>{rangeOpen&&<div className="history-range-pop"><header><CalendarDays/><div><b>Période des chargements</b><small>Sélectionnez un intervalle</small></div></header><div><label><span>Date de début</span><input type="date" defaultValue="2025-05-01"/></label><label><span>Date de fin</span><input type="date" defaultValue="2025-05-14"/></label></div><footer><button onClick={()=>setRangeOpen(false)}>Annuler</button><button onClick={()=>setRangeOpen(false)}>Appliquer</button></footer></div>}</div><div className="history-filter-wrap"><button className={filtersOpen?'active':''} onClick={()=>{setFiltersOpen(!filtersOpen);setRangeOpen(false)}}><Filter />Filtres</button>{filtersOpen&&<div className="history-filter-pop"><b>Statut global</b>{['Tous','Réussi','Partiel','Échec'].map(value=><button key={value} className={status===value?'active':''} onClick={()=>{setStatus(value);setPage(1)}}>{value}</button>)}</div>}</div><div className="history-logo"><img src={bccLogo} alt=""/><b>BANQUE CENTRALE<br/>DU CONGO</b></div></div></header>
    <section className="history-kpis"><article><span><CalendarDays /></span><div><b>Période couverte</b><strong>14 jours</strong><small>Du 01/05/2025 au 14/05/2025</small></div></article><article><span><Database /></span><div><b>Total d’enregistrements</b><strong>14</strong><small>jours enregistrés</small></div></article><article><span className="green"><Check /></span><div><b>Taux de réussite Staging</b><strong>85,7 %</strong><small>12 / 14 jours</small></div></article><article><span><Landmark /></span><div><b>Taux de réussite DW</b><strong>71,4 %</strong><small>10 / 14 jours</small></div></article></section>
    <section className="history-charts"><article className="card history-line"><header><h2>Évolution des chargements</h2><label className="history-display-control"><span>Afficher par :</span><span className="history-period-select"><select aria-label="Période d’affichage"><option>Jour</option><option>Semaine</option></select><ChevronDown/></span></label></header><div><Line data={lineData} options={lineOptions}/></div><footer><span className="blue">Staging (Taux de réussite)</span><span className="green">DW (Taux de réussite)</span></footer></article><article className="card history-donut"><h2>Répartition des statuts (sur la période)</h2><div><div className="history-donut-chart"><Doughnut data={donutData} plugins={[donutPercentPlugin]} options={{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:{display:false},tooltip:{enabled:false}}}}/></div><ul><li className="green"><i/> <b>Réussi (10 jours)</b><small>Staging et DW réussis</small></li><li className="red"><i/> <b>Partiel (3 jours)</b><small>Un seul processus réussi</small></li><li className="gray"><i/> <b>Échec (2 jours)</b><small>Staging et DW échoués</small></li></ul></div></article></section>
    <section className="card history-table-card"><header><h2>Détail de l’historique</h2><div><label><Search/><input value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}} placeholder="Rechercher une date..."/></label><button onClick={exportCsv}><Download/>Exporter</button></div></header><div className="history-table-wrap"><table><thead><tr><th>Date</th><th>Staging</th><th>Statut Staging</th><th>DW</th><th>Statut DW</th><th>Statut global</th><th>Durée totale</th><th>Heure d’exécution</th><th></th></tr></thead><tbody>{shown.map(row=><tr key={row[0]}><td><b>{row[0]}</b></td><td>{row[1]}</td><td><Badge value={row[2]?'Réussi':'Échec'}/></td><td>{row[3]}</td><td><Badge value={row[4]?'Réussi':'Échec'}/></td><td><Badge value={row[5]}/></td><td>{row[6]}</td><td>{row[7]}</td><td><button onClick={()=>setSelected(row)}><ChevronRight/></button></td></tr>)}</tbody></table></div><footer className="history-pagination"><span>Affichage {(page-1)*pageSize+1} à {Math.min(page*pageSize,filtered.length)} sur {filtered.length} entrées</span><div className="history-pagination-controls"><nav aria-label="Pagination"><button onClick={()=>setPage(1)} disabled={page===1} aria-label="Première page"><ChevronFirst/></button><button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} aria-label="Page précédente"><ChevronLeft/></button>{Array.from({length:pages},(_,i)=><button key={i} className={page===i+1?'current':''} onClick={()=>setPage(i+1)}>{i+1}</button>)}<button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page===pages} aria-label="Page suivante"><ChevronRight/></button><button onClick={()=>setPage(pages)} disabled={page===pages} aria-label="Dernière page"><ChevronLast/></button></nav><label className="history-page-size"><span>Lignes</span><select value={pageSize} onChange={e=>{setPageSize(Number(e.target.value));setPage(1)}} aria-label="Nombre de lignes par page"><option value="5">5 par page</option><option value="10">10 par page</option><option value="14">14 par page</option></select><ChevronDown/></label></div></footer></section>
    {selected&&<HistoryDetail row={selected} onClose={()=>setSelected(null)}/>} 
  </div>;
}

function Badge({value}) { return <span className={`history-badge ${value==='Réussi'?'success':value==='Partiel'?'partial':'failed'}`}>{value}</span>; }

function HistoryDetail({ row, onClose }) {
  const [date, staging, stagingOk, dw, dwOk, global, duration, executionTime] = row;
  return <div className="history-detail-backdrop" onMouseDown={event=>event.target===event.currentTarget&&onClose()}>
    <article className="history-detail-card" role="dialog" aria-modal="true" aria-labelledby="history-detail-title">
      <header><div className="history-detail-heading"><span><CalendarDays/></span><div><small>DÉTAIL DU CHARGEMENT</small><h2 id="history-detail-title">Historique du {date}</h2></div></div><button className="history-detail-close" onClick={onClose} aria-label="Fermer le détail"><X/></button></header>
      <div className="history-detail-summary"><div><small>Statut global</small><Badge value={global}/></div><div><small>Durée totale</small><strong><Clock3/>{duration}</strong></div><div><small>Heure d’exécution</small><strong><Clock3/>{executionTime}</strong></div></div>
      <div className="history-detail-processes"><ProcessDetail label="Staging" value={staging} success={stagingOk}/><span className={`history-detail-link ${stagingOk&&dwOk?'complete':''}`} aria-hidden="true"><i/><ChevronRight/><i/></span><ProcessDetail label="Data Warehouse" value={dw} success={dwOk}/></div>
      <footer><button onClick={onClose}>Fermer</button></footer>
    </article>
  </div>;
}

function ProcessDetail({ label, value, success }) {
  return <section className={`history-process ${success?'success':'failed'}`}><span className="history-process-icon">{success?<Check/>:<X/>}</span><div><small>PROCESSUS</small><h3>{label}</h3></div><dl><dt>Enregistrement</dt><dd>{value}</dd><dt>Statut</dt><dd><Badge value={success?'Réussi':'Échec'}/></dd></dl></section>;
}
