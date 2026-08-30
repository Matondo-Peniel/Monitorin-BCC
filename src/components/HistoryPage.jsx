import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, Database, Download, Filter, History, RefreshCw, Search, XCircle } from 'lucide-react';
import { api } from '../api';
import { addDays } from '../date';
import { useActiveDate } from '../active-date';
import { useActiveSource } from '../active-source';
import GlobalDateControls from './GlobalDateControls';
import CustomSelect from './CustomSelect';
import Pagination from './Pagination';
import { readGeneralPreferences } from '../preferences';

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });
const timeFormatter = new Intl.DateTimeFormat('fr-FR', { timeStyle: 'medium' });
const toStatus = row => row.staging && row.entrepot ? 'Réussi' : row.staging ? 'Partiel' : 'Échoué';
const stepStatus = value => value ? 'Réussi' : 'Échoué';
const formatDate = value => dateFormatter.format(new Date(value));
const formatTime = value => timeFormatter.format(new Date(value));

export default function HistoryPage() {
  const { activeDate } = useActiveDate();
  const { sources, sourceId, setSourceId, loading: loadingSources } = useActiveSource();
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => Number(readGeneralPreferences().pageSize) || 25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Tous');
  const [refreshKey, setRefreshKey] = useState(0);
  const [range, setRange] = useState(() => ({ start: addDays(activeDate, -29), end: activeDate }));
  const [draftRange, setDraftRange] = useState(() => ({ start: addDays(activeDate, -29), end: activeDate }));
  const [rangeError, setRangeError] = useState('');
  const start = range.start;
  const end = range.end;
  const endExclusive = addDays(end, 1);

  const applyRange = () => {
    if (!draftRange.start || !draftRange.end) { setRangeError('Les deux dates sont obligatoires.'); return; }
    if (draftRange.start > draftRange.end) { setRangeError('La date de début doit précéder la date de fin.'); return; }
    setRangeError('');
    setPage(1);
    setRange(draftRange);
  };

  useEffect(() => {
    const update = event => { setPageSize(Number(event.detail.pageSize) || 25); setPage(1); };
    window.addEventListener('monitoring:preferences', update);
    return () => window.removeEventListener('monitoring:preferences', update);
  }, []);

  useEffect(() => {
    const next = { start: addDays(activeDate, -29), end: activeDate };
    setRange(next);
    setDraftRange(next);
    setRangeError('');
    setPage(1);
  }, [activeDate]);
  useEffect(() => { setPage(1); }, [sourceId]);
  useEffect(() => {
    if (!sourceId) { setLoading(false); return; }
    let mounted = true;
    setLoading(true);
    setError('');
    Promise.all([api.history(sourceId, start, endExclusive, page, pageSize), api.summary(sourceId, start, endExclusive)]).then(([result, nextSummary]) => {
      if (!mounted) return;
      setRows(result.donnees || []);
      setTotal(result.total || 0);
      setSummary(nextSummary);
    }).catch(exception => { if (mounted) setError(exception.message); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [endExclusive, page, pageSize, refreshKey, sourceId, start]);

  const displayed = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('fr-FR');
    return rows.filter(row => {
      const currentStatus = toStatus(row);
      return (filter === 'Tous' || currentStatus === filter) && (!search || `${formatDate(row.dateHeureETL)} ${formatTime(row.dateHeureETL)} ${currentStatus}`.toLocaleLowerCase('fr-FR').includes(search));
    });
  }, [filter, query, rows]);
  const sourceOptions = sources.map(source => ({ value: String(source.idConnexion), label: source.nomConnexion, icon: Database }));
  const statusOptions = [{ value: 'Tous', label: 'Tous les statuts', icon: Filter }, { value: 'Réussi', label: 'Réussi', icon: CheckCircle2, tone: 'is-success' }, { value: 'Partiel', label: 'Partiel', icon: AlertTriangle, tone: 'is-warning' }, { value: 'Échoué', label: 'Échoué', icon: XCircle, tone: 'is-danger' }];
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const stagingSuccess = Math.max(0, (summary?.total || 0) - (summary?.echecsStaging || 0));
  const completeRate = summary?.total ? Math.round((summary.reussitesCompletes || 0) * 100 / summary.total) : 0;
  const selectedSource = sources.find(source => String(source.idConnexion) === sourceId);
  const refresh = useCallback(() => setRefreshKey(value => value + 1), []);

  const exportVisibleRows = async () => {
    if (!sourceId) return;
    try {
      const file = await api.downloadHistoryReport(sourceId, start, endExclusive);
      const url = URL.createObjectURL(file);
      const link = document.createElement('a'); link.href = url; link.download = `historique-etl-${start}-${end}.csv`; document.body.append(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (exception) {
      setError(exception.message);
    }
  };

  return <main className="ui-page"><header className="ui-page-header ui-history-head"><div className="ui-page-heading"><div className="ui-eyebrow"><History />Traçabilité ETL</div><h1>Historique des chargements</h1><p>Consultez les exécutions sur la période de votre choix.</p></div><div className="ui-header-actions">{sourceOptions.length > 0 && <CustomSelect label="Source" value={sourceId} onChange={setSourceId} options={sourceOptions} icon={Database} ariaLabel="Source surveillée" />}<GlobalDateControls onRefresh={refresh} refreshing={loading} /></div></header>
    <section className="history-custom-range" aria-label="Période de consultation"><div className="history-custom-range-title"><span><CalendarDays /></span><div><b>Période personnalisée</b><small>Sélectionnez les dates incluses dans l’historique.</small></div></div><label><span>Date de début</span><input type="date" value={draftRange.start} max={draftRange.end || activeDate} onChange={event => setDraftRange(current => ({ ...current, start: event.target.value }))} /></label><label><span>Date de fin</span><input type="date" value={draftRange.end} min={draftRange.start} max={activeDate} onChange={event => setDraftRange(current => ({ ...current, end: event.target.value }))} /></label><button type="button" className="history-range-apply" disabled={loading || (draftRange.start === range.start && draftRange.end === range.end)} onClick={applyRange}>Appliquer</button>{rangeError && <p role="alert">{rangeError}</p>}</section>
    {error && !sourceId ? <section className="ui-panel"><ErrorState message={`Impossible de charger les sources : ${error}`} /></section> : !sourceId && !loading ? <section className="ui-panel"><EmptyState title="Aucune source active" message="Aucune source surveillée n’est disponible dans la configuration de monitoring." /></section> : <><section className="ui-kpi-grid"><Metric icon={Database} title="Exécutions" value={summary?.total || 0} note="Pour la période active" /><Metric icon={CheckCircle2} tone="success" title="Réussites Staging" value={stagingSuccess} note={`${summary?.tauxStaging ?? 0}% de réussite`} /><Metric icon={CheckCircle2} tone="success" title="Data Warehouse" value={`${summary?.tauxEntrepot ?? 0}%`} note="Taux de réussite" /><Metric icon={summary?.echecsStaging || summary?.echecsEntrepot ? AlertTriangle : CheckCircle2} tone={completeRate === 100 ? 'success' : completeRate ? 'warning' : 'danger'} title="Taux global" value={`${completeRate}%`} note={`${summary?.reussitesCompletes || 0} exécution(s) complètes`} /></section><section className="ui-panel"><header className="ui-table-card-head ui-history-table-head"><div><h2 className="ui-panel-title">Détail de l’historique</h2><p className="ui-panel-copy">{selectedSource?.nomConnexion || 'Source surveillée'} · du {start} au {activeDate}</p></div><div className="ui-toolbar"><label className="ui-field ui-field--search"><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Filtrer cette page…" /></label><CustomSelect label="Statut" value={filter} onChange={setFilter} options={statusOptions} icon={Filter} ariaLabel="Statut global" /><button className="ui-button ui-button--secondary" type="button" disabled={!displayed.length} onClick={exportVisibleRows}><Download />Exporter la page</button><button className="ui-button ui-icon-button" type="button" title="Actualiser l’historique" aria-label="Actualiser l’historique" disabled={loading || !sourceId} onClick={refresh}><RefreshCw className={loading ? 'spin' : ''} /></button></div></header>{error ? <ErrorState message={`Impossible de charger l’historique : ${error}`} /> : loading ? <EmptyState title="Chargement de l’historique" message="Lecture des exécutions enregistrées…" /> : <><div className="ui-table-wrap"><table className="ui-table"><thead><tr><th>Date</th><th>Heure</th><th>Staging</th><th>Data Warehouse</th><th>Statut global</th></tr></thead><tbody>{displayed.map(row => <tr key={row.id}><td><strong>{formatDate(row.dateHeureETL)}</strong></td><td className="ui-cell-muted">{formatTime(row.dateHeureETL)}</td><td><Badge value={stepStatus(row.staging)} /></td><td><Badge value={stepStatus(row.entrepot)} /></td><td><Badge value={toStatus(row)} /></td></tr>)}</tbody></table></div>{!displayed.length && <EmptyState title="Aucune exécution trouvée" message={rows.length ? 'Aucune exécution de cette page ne correspond aux filtres.' : 'Aucune exécution n’a été enregistrée pour cette période.'} />}<Pagination currentPage={page} totalPages={pageCount} totalItems={total} pageSize={pageSize} itemLabel="historique" itemLabelPlural="historiques" disabled={loading} onPageChange={setPage} /></>}</section></>}
  </main>;
}

const Metric = ({ icon: Icon, title, value, note, tone = '' }) => <article className="ui-kpi-card"><span className={`ui-icon-wrap ${tone ? `is-${tone}` : ''}`}><Icon /></span><div><span className="ui-kpi-label">{title}</span><strong className="ui-kpi-value">{value}</strong><small className="ui-kpi-note">{note}</small></div></article>;
function Badge({ value }) { const className = value === 'Réussi' ? 'ui-status--success' : value === 'Partiel' ? 'ui-status--partial' : 'ui-status--danger'; const Icon = value === 'Réussi' ? CheckCircle2 : value === 'Partiel' ? AlertTriangle : XCircle; return <span className={`ui-status ${className}`}><Icon />{value}</span>; }
const EmptyState = ({ title, message }) => <div className="ui-empty-state"><History /><strong>{title}</strong><p>{message}</p></div>;
const ErrorState = ({ message }) => <div className="ui-error-state"><AlertTriangle /><strong>Chargement indisponible</strong><p>{message}</p></div>;
