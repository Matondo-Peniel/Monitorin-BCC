import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Database, Landmark, TrendingUp, X } from 'lucide-react';
import { api } from '../api';
import { addDays } from '../date';
import { useActiveDate } from '../active-date';
import { useActiveSource } from '../active-source';
import GlobalDateControls from './GlobalDateControls';
import LoadingTable from './LoadingTable';
import BccBrand from './BccBrand';

const status = row => row.staging && row.entrepot ? 'Réussi' : row.staging ? 'Partiel' : 'Échoué';

export default function AllLoadings() {
  const { activeDate } = useActiveDate();
  const { source, sourceId } = useActiveSource();
  const [data, setData] = useState(null);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    setRefreshing(true);
    setError('');
    try {
      if (!sourceId || !source) { setData(null); setRows([]); return; }
      const [dashboard, result] = await Promise.all([api.dashboard(activeDate, '7', sourceId), api.history(sourceId, activeDate, addDays(activeDate, 1), 1, 100)]);
      const sources = [source]; const ranges = [result];
      const mapped = ranges.flatMap((result, index) => result.donnees.map(item => ({
        id: item.id,
        source: sources[index].nomConnexion,
        time: new Date(item.dateHeureETL).toLocaleTimeString('fr-FR'),
        staging: item.staging ? 'Réussi' : 'Échoué',
        entrepot: item.entrepot ? 'Réussi' : 'Échoué',
        status: status(item),
        dateHeureETL: item.dateHeureETL,
      }))).sort((left, right) => new Date(right.dateHeureETL) - new Date(left.dateHeureETL));
      setData(dashboard);
      setRows(mapped);
      setSelected(mapped[0] || null);
    } catch (exception) {
      setError(exception.message);
    } finally {
      setRefreshing(false);
    }
  }, [activeDate, source, sourceId]);

  useEffect(() => { load(); }, [load]);
  const selectedLabel = useMemo(() => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${activeDate}T12:00:00`)), [activeDate]);
  const metrics = data?.metrics;
  return <div className="tracking-page"><header className="tracking-header"><div><h1>Suivi des chargements</h1><p>Surveillez l’état des processus ETL de vos données</p></div><div className="tracking-header-actions"><GlobalDateControls onRefresh={load} refreshing={refreshing} className="tracking-toolbar" /><BccBrand className="tracking-brand" compact /></div></header>{!sourceId ? <section className="card tracking-empty">Configurez d’abord une source depuis la page Sources.</section> : error ? <section className="card tracking-empty">Impossible de charger les données : {error}</section> : !data ? <section className="card tracking-empty">Chargement des données enregistrées…</section> : <><section className="ui-kpi-grid tracking-kpis-alert-style" aria-label="Indicateurs de chargement"><Kpi icon={Database} title="Sources chargées" value={metrics.loadedSources} note={`${metrics.loadedSources} sur ${metrics.activeSources} sources actives`} /><Kpi icon={Check} tone="success" title="Source → Staging" value={`${metrics.stagingRate}%`} note={`${metrics.stagingSuccess} réussis · ${metrics.stagingFailed} échoués`} /><Kpi icon={Landmark} tone="cyan" title="Staging → Entrepôt" value={`${metrics.warehouseRate}%`} note={`${metrics.warehouseSuccess} réussis · ${metrics.warehouseFailed} échoués`} /><Kpi icon={TrendingUp} tone="navy" title="Taux de réussite global" value={`${metrics.globalRate}%`} note={`${metrics.total} chargement(s) · ${selectedLabel}`} /></section><section className="tracking-layout"><div className="tracking-main"><div className="card tracking-table"><LoadingTable loadings={rows} onSelect={setSelected} title={`Détail des chargements du ${selectedLabel}`} /></div></div><Detail row={selected} /></section></>}</div>;
}

function Kpi({ icon: Icon, title, value, note, tone = '' }) {
  return <article className="ui-kpi-card">
    <span className={`ui-icon-wrap ${tone ? `is-${tone}` : ''}`}><Icon /></span>
    <div>
      <span className="ui-kpi-label">{title}</span>
      <strong className="ui-kpi-value">{value}</strong>
      <small className="ui-kpi-note">{note}</small>
    </div>
  </article>;
}

function Detail({ row }) {
  if (!row) return <aside className="card tracking-detail"><h2>Détails du chargement</h2><p className="tracking-empty">Aucun chargement enregistré pour cette date.</p></aside>;
  const failed = row.status !== 'Réussi';
  return <aside className="card tracking-detail"><h2>Détails du chargement</h2><h3><Database /> {row.source}</h3><dl><dt>Heure de début</dt><dd>{row.time}</dd><dt>Statut global</dt><dd><span className={`badge ${failed ? 'failed' : 'success'}`}>{row.status}</span></dd></dl><h3>Étapes du processus</h3><div className={`tracking-step ${row.staging === 'Réussi' ? '' : 'failed'}`}>{row.staging === 'Réussi' ? <Check /> : <X />}<b>Source → Staging</b><span>{row.staging}</span></div><div className={`tracking-step ${row.entrepot === 'Réussi' ? '' : 'failed'}`}>{row.entrepot === 'Réussi' ? <Check /> : <X />}<b>Staging → Entrepôt</b><span>{row.entrepot}</span></div>{failed && <p className="error">Une étape du chargement a échoué. Consultez les alertes associées pour le détail disponible.</p>}</aside>;
}
