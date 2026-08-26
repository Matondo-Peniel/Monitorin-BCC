import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, BarChart3, Check, Clock3, CloudUpload, Database, Info, Landmark, Settings, X } from 'lucide-react';
import { api } from '../api';
import { addDays } from '../date';
import { useActiveDate } from '../active-date';
import GlobalDateControls from './GlobalDateControls';
import BccBrand from './BccBrand';

const dateLabel = value => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`));

export default function FluxETLPage({ onNavigate }) {
  const { activeDate } = useActiveDate();
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState(null);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError('');
    try {
      const [dashboard, sources] = await Promise.all([api.dashboard(activeDate), api.sources()]);
      const results = await Promise.all(sources.map(source => api.history(source.idConnexion, activeDate, addDays(activeDate, 1), 1, 100)));
      const loadings = results.flatMap((result, index) => (result.donnees || []).map(item => ({
        title: `${sources[index].nomConnexion} → ${item.entrepot ? 'Entrepôt' : 'Staging'}`,
        sub: item.staging && item.entrepot ? 'Chargement terminé' : 'Étape échouée',
        time: new Date(item.dateHeureETL).toLocaleTimeString('fr-FR'),
        ok: Boolean(item.staging && item.entrepot),
        dateHeureETL: item.dateHeureETL,
      }))).sort((left, right) => new Date(right.dateHeureETL) - new Date(left.dateHeureETL));
      setData(dashboard);
      setRows(loadings);
    } catch (exception) {
      setError(exception.message);
    } finally {
      setRefreshing(false);
    }
  }, [activeDate]);

  useEffect(() => { refresh(); }, [refresh]);
  const metrics = data?.metrics || {};
  const transitions = [
    { completed: metrics.stagingSuccess || 0, total: metrics.total || 0, rate: metrics.stagingRate || 0 },
    { completed: metrics.warehouseSuccess || 0, total: metrics.total || 0, rate: metrics.warehouseRate || 0 },
  ].map(transition => ({
    ...transition,
    complete: transition.total > 0 && transition.completed === transition.total,
    label: transition.total === 0 ? 'Aucune exécution' : transition.completed === transition.total ? 'Réussi' : 'Échoué',
  }));
  const lastLoadingTime = rows[0]?.time || '—';
  const stages = [
    ['SOURCES', `${metrics.loadedSources || 0} / ${metrics.activeSources || 0}`, Database, (metrics.loadedSources || 0) > 0],
    ['STAGING AREA', `${metrics.stagingSuccess || 0} / ${metrics.total || 0}`, Database, (metrics.stagingFailed || 0) === 0 && (metrics.total || 0) > 0],
    ['DATA WAREHOUSE', `${metrics.warehouseSuccess || 0} / ${metrics.total || 0}`, Landmark, (metrics.warehouseFailed || 0) === 0 && (metrics.total || 0) > 0],
    ['TABLEAUX DE BORD', 'Reporting & Analytics', BarChart3, null],
  ];

  return <div className="flux-page">
    <header className="flux-header"><div><h1>Flux ETL</h1><p>Visualisez le flux et l’état de vos processus ETL pour la date active.</p></div><div className="flux-header-actions"><GlobalDateControls onRefresh={refresh} refreshing={refreshing} className="flux-actions" /><BccBrand className="flux-brand" compact /></div></header>
    {error && <section className="card tracking-empty">Impossible de charger le flux ETL : {error}</section>}
    {!error && !data && <section className="card tracking-empty">Chargement des données du flux ETL…</section>}
    {data && <><section className="card flux-global"><h2>Flux ETL global</h2><div className="pipeline">
      {stages.map(([name, subtitle, Icon, state], index) => <div className="pipeline-unit" key={name}>
        <button type="button" className={`pipeline-card ${state ? 'complete' : ''} ${selected?.title === name ? 'selected' : ''}`} onClick={() => name === 'TABLEAUX DE BORD' ? onNavigate('Tableaux de bord') : setSelected({ title: name, subtitle, status: state ? 'Opérationnel' : 'À surveiller', rate: index === 0 ? (metrics.activeSources ? Math.round(metrics.loadedSources * 100 / metrics.activeSources) : 0) : transitions[index - 1]?.rate || 0, completed: index === 0 ? metrics.loadedSources || 0 : transitions[index - 1]?.completed || 0, total: index === 0 ? metrics.activeSources || 0 : transitions[index - 1]?.total || 0 })} title={name === 'TABLEAUX DE BORD' ? 'Ouvrir les tableaux de bord' : `Consulter le détail de ${name}`}><b>{name}</b><small>{subtitle}</small><span><Icon /></span>{state && <i><Check /></i>}</button>
        {index < stages.length - 1 && <div className={`pipeline-link ${transitions[index]?.complete ? 'complete' : ''}`}><ArrowRight />{transitions[index] && <strong><span>{transitions[index].completed} / {transitions[index].total}</span><small className={transitions[index].complete ? '' : 'failed-text'}>{transitions[index].label}</small><em>({transitions[index].rate}%)</em></strong>}</div>}
      </div>)}
    </div><div className="pipeline-feedback"><svg viewBox="0 0 100 52" preserveAspectRatio="none" aria-hidden="true"><path className="feedback-line" d="M8 0V32H35V0" /><path className="feedback-head" d="M33.8 7 35 0l1.2 7" /><path className="feedback-line" d="M39 0V32H66V0" /><path className="feedback-head" d="M64.8 7 66 0l1.2 7" /></svg><small className="feedback-one"><Clock3 /><span>Dernier chargement : {lastLoadingTime}<br />Taux de réussite : {transitions[0].rate}%</span></small><small className="feedback-two"><Clock3 /><span>Dernier chargement : {lastLoadingTime}<br />Taux de réussite : {transitions[1].rate}%</span></small></div></section>
    <section className="flux-grid">
      <section className="card stage-status"><h2>Statut par étape</h2>{[
        [ArrowRight, 'Sources → Staging', `${metrics.stagingSuccess || 0} / ${metrics.total || 0}`, metrics.stagingRate || 0, (metrics.stagingFailed || 0) === 0],
        [Database, 'Staging → Entrepôt', `${metrics.warehouseSuccess || 0} / ${metrics.total || 0}`, metrics.warehouseRate || 0, (metrics.warehouseFailed || 0) === 0],
        [Settings, 'Transformations', `${metrics.warehouseSuccess || 0} / ${metrics.total || 0}`, metrics.warehouseRate || 0, (metrics.warehouseFailed || 0) === 0],
        [CloudUpload, 'Chargement DW', `${metrics.warehouseSuccess || 0} / ${metrics.total || 0}`, metrics.warehouseRate || 0, (metrics.warehouseFailed || 0) === 0],
      ].map(([Icon, title, count, progress, ok]) => <button type="button" className={`status-row ${ok ? '' : 'failed'}`} key={title} onClick={() => setSelected({ title, subtitle: 'Étape du processus ETL', status: ok ? 'Réussi' : 'Échec détecté', rate: progress, count })}><span><Icon /></span><div><b>{title}</b><small>{ok ? 'Processus disponible' : 'Des échecs ont été détectés'}</small><i><em style={{ width: `${progress}%` }} /></i></div><strong>{count}<small className={ok ? '' : 'failed-text'}>{ok ? 'Réussi' : 'Échoué'}</small><em>{progress}%</em></strong></button>)}</section>
      <section className="card flux-summary"><h2>Résumé du flux ETL</h2><div>{[
        [Check, `${(metrics.stagingSuccess || 0) + (metrics.warehouseSuccess || 0)}`, 'Étapes réussies', 'green'], [X, `${(metrics.stagingFailed || 0) + (metrics.warehouseFailed || 0)}`, 'Étapes échouées', 'red'], [Database, `${metrics.activeSources || 0}`, 'Sources actives', 'blue'], [Database, `${metrics.total || 0}`, 'Chargements du jour', 'blue'], [Clock3, rows[0]?.time || '—', 'Dernier chargement', 'blue'], [Clock3, dateLabel(activeDate), 'Date active', 'blue'],
      ].map(([Icon, value, label, tone]) => <button type="button" key={label} onClick={() => setSelected({ title: label, subtitle: 'Indicateur du flux ETL', status: 'Valeur enregistrée', value })}><span className={tone}><Icon /></span><strong>{value}</strong><small>{label}</small></button>)}</div></section>
      <section className="card recent-steps"><h2>Étapes récentes</h2><div>{rows.slice(0, 5).map(row => <button type="button" key={`${row.title}-${row.dateHeureETL}`} onClick={() => setSelected({ ...row, status: row.ok ? 'Réussi' : 'Échoué', subtitle: row.sub })}><span className={row.ok ? 'ok' : 'bad'}>{row.ok ? <Check /> : <X />}</span><div><b>{row.title}</b><small className={row.ok ? '' : 'failed-text'}>{row.sub}</small></div><time>{row.time}</time></button>)}{!rows.length && <p className="tracking-empty">Aucun chargement enregistré pour cette date.</p>}</div><button type="button" className="history-button" onClick={() => onNavigate('Historique')}>Voir tout l’historique <ArrowRight /></button></section>
    </section>
    <section className="card flux-notice"><span><Info /></span><div><b>{data.alerts?.length ? `${data.alerts.length} alerte(s) détectée(s)` : 'Aucune alerte enregistrée'}</b><small>Les alertes affichées proviennent du monitoring ETL.</small></div><button type="button" onClick={() => onNavigate('Alertes')}>Voir les alertes <ArrowRight /></button></section>
    {selected && <FluxDetail detail={selected} activeDate={activeDate} rows={rows} onClose={() => setSelected(null)} onHistory={() => onNavigate('Historique')} />}</>}
  </div>;
}

function FluxDetail({ detail, activeDate, rows, onClose, onHistory }) {
  const related = rows.filter(row => row.title.includes(detail.title) || detail.title.includes(row.title.split(' → ')[0])).slice(0, 3);
  return <div className="flux-detail-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><aside className="flux-detail-panel" role="dialog" aria-modal="true" aria-labelledby="flux-detail-title"><header><div><small>Détail opérationnel</small><h2 id="flux-detail-title">{detail.title}</h2><p>{detail.subtitle || 'Données issues du monitoring ETL.'}</p></div><button type="button" aria-label="Fermer" onClick={onClose}><X /></button></header><section className="flux-detail-status"><span className={detail.ok === false || String(detail.status).includes('Échec') ? 'is-danger' : 'is-success'}>{detail.ok === false || String(detail.status).includes('Échec') ? <X /> : <Check />}</span><div><small>Statut</small><strong>{detail.status || 'Information disponible'}</strong></div></section><dl>{detail.value !== undefined && <div><dt>Valeur</dt><dd>{detail.value}</dd></div>}{detail.count && <div><dt>Exécutions</dt><dd>{detail.count}</dd></div>}{detail.completed !== undefined && <div><dt>Traitées</dt><dd>{detail.completed} sur {detail.total}</dd></div>}{detail.rate !== undefined && <div><dt>Taux de réussite</dt><dd>{detail.rate}%</dd></div>}<div><dt>Date active</dt><dd>{dateLabel(activeDate)}</dd></div>{detail.time && <div><dt>Heure</dt><dd>{detail.time}</dd></div>}</dl><section className="flux-detail-recent"><h3>Exécutions associées</h3>{related.length ? related.map(row => <article key={`${row.title}-${row.dateHeureETL}`}><span className={row.ok ? 'is-success' : 'is-danger'}>{row.ok ? <Check /> : <X />}</span><div><b>{row.title}</b><small>{row.sub}</small></div><time>{row.time}</time></article>) : <p>Aucune exécution associée pour cette date.</p>}</section><footer><button type="button" onClick={onClose}>Fermer</button><button type="button" onClick={onHistory}>Consulter l’historique <ArrowRight /></button></footer></aside></div>;
}
