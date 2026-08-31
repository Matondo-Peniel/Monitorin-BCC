import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Database, History, Landmark, Server, XCircle } from 'lucide-react';
import { api } from '../api';
import { addDays, localDate } from '../date';
import { useActiveDate } from '../active-date';
import { useActiveSource } from '../active-source';
import GlobalDateControls from './GlobalDateControls';
import CustomSelect from './CustomSelect';
import SourceConfigurator from './SourceConfigurator';

const formatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'medium' });
const dateLabel = value => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
const formatDateTime = value => value && !Number.isNaN(new Date(value).valueOf()) ? formatter.format(new Date(value)) : '—';
const globalStatus = row => row.staging && row.entrepot ? 'Réussi' : row.staging ? 'Partiel' : 'Échoué';
const isDemoSource = source => /démonstration|demonstration/i.test(source?.nomConnexion || '') || /(^|[-_])demo($|[-_])/i.test(source?.nomServeur || '');

export default function SourcePage({ onNavigate, user }) {
  const { activeDate, setActiveDate } = useActiveDate();
  const { sources, sourceId, setSourceId, refreshSources } = useActiveSource();
  const [rows, setRows] = useState([]), [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [refreshKey, setRefreshKey] = useState(0);
  const [canConfigure, setCanConfigure] = useState(Boolean(user?.roles?.includes('ADMINISTRATEUR')));
  const [configurationOpen, setConfigurationOpen] = useState(false);

  useEffect(() => { if (!user) api.me().then(current => setCanConfigure(Boolean(current?.roles?.includes('ADMINISTRATEUR')))).catch(() => {}); }, [user]);
  useEffect(() => { if (!sourceId) return; let mounted = true; setLoading(true); setError(''); Promise.all([api.history(sourceId, activeDate, addDays(activeDate, 1), 1, 100), api.latest(sourceId)]).then(([history, last]) => { if (mounted) { setRows(history.donnees || []); setLatest(last?.donnee || null); } }).catch(e => { if (mounted) setError(e.message); }).finally(() => { if (mounted) setLoading(false); }); return () => { mounted = false; }; }, [activeDate, refreshKey, sourceId]);

  const source = useMemo(() => sources.find(item => String(item.idConnexion) === sourceId), [sourceId, sources]);
  const sourceOptions = sources.map(item => ({ value: String(item.idConnexion), label: item.nomConnexion, icon: Database }));
  const staging = rows.filter(row => row.staging).length, warehouse = rows.filter(row => row.entrepot).length;
  const latestDate = latest?.dateHeureETL ? localDate(new Date(latest.dateHeureETL)) : '';
  const refresh = useCallback(() => setRefreshKey(value => value + 1), []);
  const configured = async item => { await refreshSources(); setSourceId(String(item.idConnexion)); setConfigurationOpen(false); };
  const cancelConfiguration = async () => {
    if (!source || !window.confirm(`Annuler la configuration de la source « ${source.nomConnexion} » ?`)) return;
    setError('');
    try {
      await api.cancelSourceConfiguration(source.idConnexion);
      setSourceId('');
      await refreshSources();
    } catch (exception) {
      setError(exception.message || 'Impossible d’annuler la configuration de cette source.');
    }
  };

  if (error && !source && !canConfigure) return <main className="ui-page"><section className="ui-panel"><ErrorState message={`Impossible de charger les sources : ${error}`} /></section></main>;
  return <main className="ui-page">
    <header className="ui-page-header"><div className="ui-page-heading"><div className="ui-eyebrow"><Database />Configuration surveillée</div><h1>Sources SQL Server</h1><p>Configurez puis consultez la table qui contient le suivi des chargements ETL.</p></div><div className="ui-header-actions">{sourceOptions.length > 0 && <CustomSelect label="Source" value={sourceId} onChange={setSourceId} options={sourceOptions} icon={Server} ariaLabel="Source surveillée" placeholder="Sélectionnez une source" />}<GlobalDateControls onRefresh={refresh} refreshing={loading} /></div></header>
    {canConfigure && (!source || configurationOpen) && <SourceConfigurator enabled onConfigured={configured} />}
    {error && source ? <section className="ui-panel"><ErrorState message={`Impossible de charger les exécutions : ${error}`} /></section> : loading || !source ? <section className="ui-panel"><EmptyState title={loading ? 'Chargement de la source' : 'Aucune source configurée'} message={loading ? 'Lecture de la configuration et des exécutions enregistrées…' : 'Un administrateur doit sélectionner une base et sa table de suivi ETL.'} /></section> : <section className="ui-source-layout">
      <section className="ui-panel ui-source-overview"><span className="ui-source-emblem"><Database /></span><div><h2>{source.nomConnexion}</h2><dl className="ui-source-facts"><Fact label="Type de connexion" value={source.typeConnexion} /><Fact label="Serveur" value={source.nomServeur} /><Fact label="Base de données" value={source.nomBase} /><Fact label="Table surveillée" value={source.nomTableMonitoring} /></dl>{canConfigure && <div className="ui-toolbar-group"><button className="ui-button ui-button--secondary" type="button" onClick={() => setConfigurationOpen(true)}>Modifier la configuration</button><button className="ui-button ui-button--secondary" type="button" onClick={cancelConfiguration}>Annuler la configuration</button></div>}</div></section>
      <section className="ui-panel ui-source-stats"><h2>Statistiques du {dateLabel(activeDate)}</h2><div className="ui-source-stat-list"><Stat icon={Database} title="Exécutions" value={rows.length} /><Stat icon={CheckCircle2} tone="success" title="Staging réussis" value={staging} /><Stat icon={Landmark} tone="success" title="Data Warehouse réussis" value={warehouse} /></div></section>
      <section className="ui-panel ui-executions-card"><header className="ui-table-card-head"><div><h2 className="ui-panel-title">Exécutions de la journée</h2><p className="ui-panel-copy">{rows.length} exécution{rows.length > 1 ? 's' : ''} le {dateLabel(activeDate)}</p></div><div className="ui-toolbar-group">{!rows.length && latest && latestDate !== activeDate && <button className="ui-button ui-button--secondary" type="button" onClick={() => setActiveDate(latestDate)}><Clock3 />Voir la dernière exécution</button>}<button className="ui-button ui-button--secondary" type="button" onClick={() => onNavigate?.('Historique')}><History />Consulter l’historique</button></div></header>{rows.length ? <div className="ui-table-wrap"><table className="ui-table"><thead><tr><th>Date et heure</th><th>Staging</th><th>Data Warehouse</th><th>Statut global</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><strong>{formatDateTime(row.dateHeureETL)}</strong></td><td><StepStatus success={row.staging} /></td><td><StepStatus success={row.entrepot} /></td><td><OverallStatus value={globalStatus(row)} /></td></tr>)}</tbody></table></div> : <EmptyState title="Aucune exécution pour cette date" message={latest ? `La dernière exécution enregistrée date du ${formatDateTime(latest.dateHeureETL)}.` : 'Cette source ne contient encore aucune exécution enregistrée.'} />}</section>
    </section>}
  </main>;
}

const Fact = ({ label, value }) => <div><dt>{label}</dt><dd>{value || 'Non renseigné'}</dd></div>;
const Stat = ({ icon: Icon, title, value, tone = '' }) => <article className="ui-source-stat"><span className={`ui-icon-wrap ${tone ? `is-${tone}` : ''}`}><Icon /></span><span><strong>{value}</strong>{title}</span></article>;
const StepStatus = ({ success }) => success ? <span className="ui-status ui-status--success"><CheckCircle2 />Réussi</span> : <span className="ui-status ui-status--danger"><XCircle />Échoué</span>;
function OverallStatus({ value }) { const className = value === 'Réussi' ? 'ui-status--success' : value === 'Partiel' ? 'ui-status--partial' : 'ui-status--danger'; const Icon = value === 'Réussi' ? CheckCircle2 : value === 'Partiel' ? Clock3 : XCircle; return <span className={`ui-status ${className}`}><Icon />{value}</span>; }
const EmptyState = ({ title, message }) => <div className="ui-empty-state"><Database /><strong>{title}</strong><p>{message}</p></div>;
const ErrorState = ({ message }) => <div className="ui-error-state"><XCircle /><strong>Chargement indisponible</strong><p>{message}</p></div>;
