import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Filter,
  Info,
  RefreshCw,
  Search,
  X,
  XCircle,
} from 'lucide-react';
import { api } from '../api';
import { useActiveSource } from '../active-source';
import { addDays, localDate } from '../date';
import BccBrand from './BccBrand';
import CustomSelect from './CustomSelect';
import Pagination from './Pagination';

const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const levelMeta = {
  CRITIQUE: { label: 'Critique', Icon: XCircle, className: 'ui-level--critical' },
  IMPORTANT: { label: 'Important', Icon: AlertTriangle, className: 'ui-level--important' },
  INFORMATIF: { label: 'Information', Icon: Info, className: 'ui-level--informative' },
};

const alertLevelOptions = [
  { value: 'Tous', label: 'Tous les niveaux', icon: Filter },
  { value: 'CRITIQUE', label: 'Critique', icon: XCircle, tone: 'is-danger' },
  { value: 'IMPORTANT', label: 'Important', icon: AlertTriangle, tone: 'is-warning' },
  { value: 'INFORMATIF', label: 'Information', icon: Info, tone: 'is-muted' },
];

const alertStateOptions = [
  { value: 'Toutes', label: 'Tous les statuts', icon: CheckCircle2 },
  { value: 'Ouvertes', label: 'Non résolues', icon: AlertCircle, tone: 'is-danger' },
  { value: 'Résolues', label: 'Résolues', icon: CheckCircle2, tone: 'is-success' },
];

const formatDateTime = value => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.valueOf()) ? dateTimeFormatter.format(date) : '—';
};

const normalizedLevel = value => String(value || 'INFORMATIF').toUpperCase();
const isResolved = alert => String(alert.statut || '').toUpperCase() === 'RESOLUE';

export default function ModulePage({ type, user }) {
  return type === 'Alertes'
    ? <AlertsPage canResolve={user?.roles?.some(role => role === 'ADMINISTRATEUR' || role === 'ANALYSTE')} />
    : <ReportsPage />;
}

function AlertsPage({ canResolve }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('Tous');
  const [state, setState] = useState('Toutes');
  const [selected, setSelected] = useState(null);
  const [actionError, setActionError] = useState('');
  const [resolving, setResolving] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadAlerts = useCallback(async () => {
    const startedAt = Date.now();
    setLoading(true);
    setError('');
    try {
      const items = await api.alerts();
      setAlerts(Array.isArray(items) ? items : []);
    } catch (exception) {
      setError(exception.message);
    } finally {
      const remaining = Math.max(0, 1000 - (Date.now() - startedAt));
      if (remaining) await new Promise(resolve => window.setTimeout(resolve, remaining));
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  const filteredRows = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('fr-FR');
    return alerts.filter(alert => {
      const matchesLevel = level === 'Tous' || normalizedLevel(alert.niveau) === level;
      const matchesState = state === 'Toutes'
        || (state === 'Ouvertes' && !isResolved(alert))
        || (state === 'Résolues' && isResolved(alert));
      const searchable = [alert.message, alert.etape, alert.niveau, alert.statut]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('fr-FR');
      return matchesLevel && matchesState && (!search || searchable.includes(search));
    });
  }, [alerts, level, query, state]);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const rows = useMemo(() => filteredRows.slice((page - 1) * pageSize, page * pageSize), [filteredRows, page]);
  useEffect(() => { setPage(1); }, [level, query, state]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const counts = useMemo(() => ({
    total: alerts.length,
    critical: alerts.filter(alert => normalizedLevel(alert.niveau) === 'CRITIQUE').length,
    important: alerts.filter(alert => normalizedLevel(alert.niveau) === 'IMPORTANT').length,
    resolved: alerts.filter(isResolved).length,
  }), [alerts]);

  const resolve = async () => {
    if (!selected || isResolved(selected)) return;
    setResolving(true);
    setActionError('');
    try {
      await api.resolveAlert(selected.idAlerte);
      const updated = { ...selected, statut: 'RESOLUE', dateResolution: new Date().toISOString() };
      setSelected(updated);
      setAlerts(items => items.map(alert => alert.idAlerte === updated.idAlerte ? updated : alert));
    } catch (exception) {
      setActionError(exception.message);
    } finally {
      setResolving(false);
    }
  };

  return <main className="ui-page">
    <header className="ui-page-header ui-alerts-head">
      <div className="ui-page-heading">
        <div className="ui-eyebrow"><AlertCircle />Suivi opérationnel</div>
        <h1>Alertes</h1>
        <p>Consultez et traitez les alertes générées par le monitoring ETL.</p>
      </div>
      <div className="module-header-actions">
        <button className="refresh" type="button" onClick={loadAlerts} disabled={loading}>
          <RefreshCw className={loading ? 'spin' : ''} />{loading ? 'Actualisation…' : 'Actualiser'}
        </button>
        <BccBrand className="module-brand" compact />
      </div>
    </header>

    <section className="ui-kpi-grid" aria-label="Synthèse des alertes">
      <Metric icon={AlertCircle} title="Alertes enregistrées" value={counts.total} note="Toutes priorités confondues" />
      <Metric icon={XCircle} tone="danger" title="Alertes critiques" value={counts.critical} note="Nécessitent une attention immédiate" />
      <Metric icon={AlertTriangle} tone="warning" title="Alertes importantes" value={counts.important} note="À analyser par l’équipe ETL" />
      <Metric icon={CheckCircle2} tone="success" title="Alertes résolues" value={counts.resolved} note="Traitées par un administrateur" />
    </section>

    <section className="ui-panel">
      <header className="ui-table-card-head ui-alerts-table-head">
        <div>
          <h2 className="ui-panel-title">Liste des alertes</h2>
          <p className="ui-panel-copy">{filteredRows.length} alerte{filteredRows.length > 1 ? 's' : ''} affichée{filteredRows.length > 1 ? 's' : ''}</p>
        </div>
        <div className="ui-toolbar" aria-label="Filtres des alertes">
          <label className="ui-field ui-field--search">
            <Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Rechercher un message…" />
          </label>
          <CustomSelect value={level} onChange={setLevel} options={alertLevelOptions} icon={Filter} ariaLabel="Niveau d’alerte" className="alerts-filter-select" />
          <CustomSelect value={state} onChange={setState} options={alertStateOptions} icon={CheckCircle2} ariaLabel="Statut de résolution" className="alerts-filter-select" />
        </div>
      </header>

      {error ? <ErrorState message={`Impossible de charger les alertes : ${error}`} /> : loading ? <EmptyState title="Chargement des alertes" message="Lecture des alertes réellement enregistrées…" /> : <>
        <div className="ui-table-wrap">
          <table className="ui-table">
            <thead><tr><th>Date et heure</th><th>Niveau</th><th>Étape</th><th>Message</th><th>Statut</th><th aria-label="Actions" /></tr></thead>
            <tbody>{rows.map(alert => <tr key={alert.idAlerte}>
              <td><strong>{formatDateTime(alert.dateHeureAlerte)}</strong></td>
              <td><AlertLevel value={alert.niveau} /></td>
              <td>{alert.etape || '—'}</td>
              <td className="ui-cell-message">{alert.message || '—'}</td>
              <td><AlertStatus alert={alert} /></td>
              <td><button className="ui-button ui-icon-button" type="button" title="Voir le détail" aria-label={`Voir le détail de l’alerte du ${formatDateTime(alert.dateHeureAlerte)}`} onClick={() => { setSelected(alert); setActionError(''); }}><Eye /></button></td>
            </tr>)}</tbody>
          </table>
        </div>
        {!rows.length && <EmptyState title="Aucune alerte trouvée" message="Modifiez les filtres ou actualisez les données." />}
        <Pagination currentPage={page} totalPages={pageCount} totalItems={filteredRows.length} pageSize={pageSize} itemLabel="alerte" disabled={loading} onPageChange={setPage} />
      </>}
    </section>

    {selected && <div className="ui-modal-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !resolving) setSelected(null); }}>
      <section className="ui-modal" role="dialog" aria-modal="true" aria-labelledby="alert-detail-title">
        <header className="ui-modal-head">
          <div><h2 id="alert-detail-title">Détail de l’alerte</h2><p className="ui-panel-copy">Informations issues du monitoring ETL</p></div>
          <button className="ui-button ui-icon-button" type="button" title="Fermer" aria-label="Fermer le détail" disabled={resolving} onClick={() => setSelected(null)}><X /></button>
        </header>
        <div className="ui-modal-body">
          <dl className="ui-detail-list">
            <div><dt>Niveau</dt><dd><AlertLevel value={selected.niveau} /></dd></div>
            <div><dt>Statut</dt><dd><AlertStatus alert={selected} /></dd></div>
            <div><dt>Étape</dt><dd>{selected.etape || '—'}</dd></div>
            <div><dt>Date de l’alerte</dt><dd>{formatDateTime(selected.dateHeureAlerte)}</dd></div>
            {selected.dateResolution && <div><dt>Date de résolution</dt><dd>{formatDateTime(selected.dateResolution)}</dd></div>}
          </dl>
          <div className="ui-message-box">{selected.message || 'Aucun message renseigné.'}</div>
          {actionError && <p className="ui-inline-error">{actionError}</p>}
          {!isResolved(selected) && !canResolve && <p className="ui-message-box">Un administrateur ou un analyste peut marquer cette alerte comme résolue.</p>}
        </div>
        <footer className="ui-modal-foot">
          <button className="ui-button ui-button--secondary" type="button" disabled={resolving} onClick={() => setSelected(null)}>Fermer</button>
          {!isResolved(selected) && canResolve && <button className="ui-button ui-button--primary" type="button" disabled={resolving} onClick={resolve}><CheckCircle2 />{resolving ? 'Résolution…' : 'Marquer comme résolue'}</button>}
        </footer>
      </section>
    </div>}
  </main>;
}

function ReportsPage() {
  const date = localDate();
  const { sourceId, sources, setSourceId } = useActiveSource();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('daily');
  const [startDate, setStartDate] = useState(addDays(date, -6));
  const [endDate, setEndDate] = useState(date);

  useEffect(() => {
    if (period === '7days') setStartDate(addDays(date, -6));
    if (period === '14days') setStartDate(addDays(date, -13));
    if (period !== 'custom') setEndDate(date);
  }, [date, period]);

  const sourceOptions = sources.map(source => ({ value: String(source.idConnexion), label: source.nomConnexion }));
  const isHistoryExport = period !== 'daily';
  const validRange = startDate && endDate && startDate <= endDate;
  const periodLabel = period === '7days' ? '7 derniers jours' : period === '14days' ? '14 derniers jours' : period === 'custom' ? 'Période personnalisée' : 'Aujourd’hui';

  const download = async () => {
    if (isHistoryExport && (!sourceId || !validRange)) return;
    setLoading(true);
    setError('');
    try {
      const file = isHistoryExport
        ? await api.downloadHistoryReport(sourceId, startDate, addDays(endDate, 1))
        : await api.downloadExecutionsReport(date);
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = isHistoryExport ? `historique-etl-${startDate}-${endDate}.csv` : `rapport-executions-${date}.csv`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (exception) {
      setError(exception.message);
    } finally {
      setLoading(false);
    }
  };

  return <main className="ui-page">
    <header className="ui-page-header">
      <div className="ui-page-heading">
        <div className="ui-eyebrow"><FileText />Exploitation des données</div>
        <h1>Rapports</h1>
        <p>Exportez les exécutions enregistrées aujourd’hui, sur une période récente ou sur un intervalle précis.</p>
      </div>
      <div className="ui-header-actions"><BccBrand className="module-brand" compact /></div>
    </header>
    <section className="ui-panel report-period-bar" aria-label="Période du rapport">
      <div><span>RAPPORT À EXPORTER</span><strong>Choisissez la période d’analyse</strong></div>
      <div className="report-period-picker" role="group" aria-label="Période du rapport"><div>{[{ value: 'daily', label: 'Aujourd’hui' }, { value: '7days', label: '7 jours' }, { value: '14days', label: '14 jours' }, { value: 'custom', label: 'Personnalisée' }].map(option => <button key={option.value} type="button" className={period === option.value ? 'active' : ''} onClick={() => setPeriod(option.value)}><CalendarDays />{option.label}</button>)}</div></div>
    </section>
    <div className="ui-report-layout">
      <section className="ui-panel ui-report-hero">
        <span><FileText /></span>
        <h2>Rapports d’exécution ETL</h2>
        <p>Le CSV reprend les exécutions, les étapes Staging et Data Warehouse, ainsi que leur statut global sur la période choisie.</p>
      </section>
      <section className="ui-panel ui-report-form">
        <h2>Préparer l’export</h2>
        <p>Définissez la période, puis générez le fichier CSV.</p>
        <div className="report-period-form">
          {isHistoryExport && sourceOptions.length > 0 && <CustomSelect label="Source" value={sourceId} onChange={setSourceId} options={sourceOptions} icon={FileText} ariaLabel="Source du rapport" />}
          {period === 'custom' && <div className="report-date-range"><label><span>Du</span><input type="date" value={startDate} max={date} onChange={event => setStartDate(event.target.value)} /></label><label><span>Au</span><input type="date" value={endDate} min={startDate} max={date} onChange={event => setEndDate(event.target.value)} /></label></div>}
        </div>
        <p className="ui-panel-copy report-period-summary">{periodLabel} : <strong>{isHistoryExport ? `${startDate} au ${endDate}` : date}</strong>.</p>
        {isHistoryExport && !sourceId && <p className="ui-inline-error">Sélectionnez une source pour exporter son historique.</p>}
        {isHistoryExport && !validRange && <p className="ui-inline-error">La date de début doit précéder ou être égale à la date de fin.</p>}
        {error && <p className="ui-inline-error">{error}</p>}
        <button className="ui-button ui-button--primary" type="button" disabled={loading || !date || (isHistoryExport && (!sourceId || !validRange))} onClick={download}><Download />{loading ? 'Génération…' : 'Télécharger le rapport CSV'}</button>
      </section>
    </div>
  </main>;
}

function Metric({ icon: Icon, title, value, note, tone = '' }) {
  return <article className="ui-kpi-card"><span className={`ui-icon-wrap ${tone ? `is-${tone}` : ''}`}><Icon /></span><div><span className="ui-kpi-label">{title}</span><strong className="ui-kpi-value">{value}</strong><small className="ui-kpi-note">{note}</small></div></article>;
}

function AlertLevel({ value }) {
  const meta = levelMeta[normalizedLevel(value)] || levelMeta.INFORMATIF;
  const { Icon } = meta;
  return <span className={`ui-level ${meta.className}`}><Icon />{meta.label}</span>;
}

function AlertStatus({ alert }) {
  return isResolved(alert)
    ? <span className="ui-status ui-status--success"><CheckCircle2 />Résolue</span>
    : <span className="ui-status ui-status--danger"><AlertCircle />Non résolue</span>;
}

function EmptyState({ title, message }) {
  return <div className="ui-empty-state"><Info /><strong>{title}</strong><p>{message}</p></div>;
}

function ErrorState({ message }) {
  return <div className="ui-error-state"><AlertTriangle /><strong>Chargement indisponible</strong><p>{message}</p></div>;
}
