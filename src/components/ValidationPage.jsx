import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, Database, Edit3, History, LayoutDashboard, Plus, RefreshCw, Settings2, Table2, X } from 'lucide-react';
import { api } from '../api';
import '../validation-page.css';
import '../validation-workspace.css';
import '../validation-configuration.css';
import '../validation-setup.css';
import '../validation-button-align.css';
import '../validation-landing.css';
import '../fact-tables-screen.css';
import '../validation-hub.css';

const number = value => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Number(value || 0));
const date = value => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
const dateTime = value => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export default function ValidationPage({ user }) {
  const isAdministrator = Boolean(user?.roles?.includes('ADMINISTRATEUR'));
  const [view, setView] = useState('overview');
  const [configured, setConfigured] = useState(null);
  const [tables, setTables] = useState([]);
  const [active, setActive] = useState('FaitValidation01');
  const [rows, setRows] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [journal, setJournal] = useState([]);
  const [configuration, setConfiguration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [newValue, setNewValue] = useState('');
  // The input now represents the final stored value; keep this alias while the
  // compact table markup calls the shared reset handler.
  const [amount, setAmount] = [newValue, setNewValue];
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [factTablesOpen, setFactTablesOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [configurationOpen, setConfigurationOpen] = useState(false);

  const loadWorkspace = async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const [nextTables, nextJournal, nextStatus, nextConfiguration] = await Promise.all([
        api.validationTables(),
        api.validationLog(),
        api.validationStatus(),
        isAdministrator ? api.validationConfiguration() : Promise.resolve(null),
      ]);
      setTables(nextTables);
      setJournal(nextJournal);
      setConfiguration(nextConfiguration);
      setConfigured(Boolean(nextStatus?.configured));
      setActive(current => nextTables.some(item => item.code === current) ? current : nextTables[0]?.code || '');
    } catch (exception) {
      setError(exception.message || 'Impossible de charger le contexte de validation.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadRows = async () => {
    if (!active) return;
    setLoadingRows(true);
    setError('');
    try {
      const result = await api.validationRows(active); setRows(result.lignes || []); setIndicators(result.indicateurs || []);
    } catch (exception) {
      setError(exception.message || 'Impossible de charger cette table de faits.');
    } finally {
      setLoadingRows(false);
    }
  };

  useEffect(() => { loadWorkspace().catch(() => {}); }, []);
  useEffect(() => { if (view === 'tables') loadRows().catch(() => {}); }, [active, view]);
  useEffect(() => { if (view === 'tables' && !factTablesOpen) setView('overview'); }, [factTablesOpen, view]);

  const selectedValue = selected ? Number(selected.row.valeurs?.[selected.key]) : 0;
  const nextValue = Number(newValue);
  const canSave = Boolean(selected) && Number.isFinite(nextValue) && reason.trim().length >= 4 && !saving;
  const tableLabel = table => table?.replace('FaitValidation', 'Table de faits ') || 'Table de faits';
  const activeChanges = useMemo(() => journal.filter(item => item.tableFait === active).length, [active, journal]);

  const save = async event => {
    event.preventDefault();
    if (!canSave || !selected) return;
    setSaving(true);
    setError('');
    try {
      await api.addValidationValue(active, { id: selected.row.id, indicateur: selected.key, nouvelleValeur: nextValue, motif: reason.trim() });
      setSelected(null);
      await Promise.all([loadRows(), loadWorkspace(true)]);
    } catch (exception) {
      setError(exception.message || 'La correction n’a pas pu être enregistrée.');
    } finally {
      setSaving(false);
    }
  };

  const canConfigure = isAdministrator;
  const cancelConfiguration = async () => {
    if (!window.confirm('Annuler la configuration de validation ? Les données et le journal ne seront pas supprimés.')) return;
    setError('');
    try {
      await api.cancelValidationConfiguration();
      setConfiguration(null);
      setConfigurationOpen(false);
      setConfigured(false);
    } catch (exception) {
      setError(exception.message || 'Impossible d’annuler la configuration.');
    }
  };
  if (configured === null || loading) return <main className="ui-page validation-page"><section className="ui-panel validation-empty">Chargement de la configuration de validation…</section></main>;
  if (!configured) return <ValidationSetup canConfigure={canConfigure} fullScreen={configurationOpen} onBack={() => loadWorkspace()} onConfigured={() => loadWorkspace()} />;
  return <main className={`ui-page validation-page ${factTablesOpen ? 'fact-tables-mode' : ''}${journalOpen ? ' journal-mode' : ''}${configurationOpen ? ' configuration-mode' : ''}`}>
    <header className="ui-page-header validation-page__header">
      <div className="ui-page-heading"><div className="ui-eyebrow"><ClipboardCheck />Contexte indépendant</div><h1>Validation des données</h1><p>Contrôlez et corrigez les tables de faits activées, sans dépendre de la configuration des sources de chargement.</p></div>
      <button className="ui-button ui-button--secondary" type="button" onClick={() => loadWorkspace(true)} disabled={loading || refreshing}><RefreshCw className={refreshing ? 'spin' : ''} />{refreshing ? 'Actualisation…' : 'Actualiser'}</button>
    </header>

    {error && <p className="ui-inline-error">{error}</p>}
    {loading ? <section className="ui-panel validation-empty">Chargement du contexte de validation…</section> : <>
      {view === 'overview' && <ValidationOverview tables={tables} journal={journal} canConfigure={canConfigure} onOpenTables={() => { setView('tables'); setFactTablesOpen(true); }} onOpenJournal={() => { setView('journal'); setJournalOpen(true); }} onOpenConfiguration={() => { setView('configuration'); setConfigurationOpen(true); }} />}
      {view === 'tables' && (factTablesOpen ? <section className="ui-panel validation-workspace"><header className="validation-workspace__head"><div><button className="validation-back" type="button" onClick={() => setFactTablesOpen(false)}><ArrowLeft />Retour aux tables de faits</button><h2 className="ui-panel-title">{tableLabel(active)}</h2><p className="ui-panel-copy">Les indicateurs sont détectés directement dans la table de faits.</p></div><span className="validation-count"><CheckCircle2 />{activeChanges} modification{activeChanges > 1 ? 's' : ''}</span></header><div className="validation-tabs" role="tablist" aria-label="Tables de faits">{tables.map(table => <button type="button" role="tab" aria-selected={active === table.code} className={active === table.code ? 'active' : ''} onClick={() => setActive(table.code)} key={table.code}>{table.nom}</button>)}</div>{loadingRows ? <div className="validation-empty">Chargement de {tableLabel(active)}…</div> : <div className="ui-table-wrap"><table className="ui-table validation-table"><thead><tr><th>Date</th>{indicators.map(key => <th key={key}>{key}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><strong>{date(row.dateReference)}</strong><span className="validation-agency">{row.agence}</span></td>{indicators.map(key => <td key={key}><button className="validation-value" type="button" onClick={() => { setSelected({ row, key }); setAmount(''); setReason(''); }} aria-label={`Modifier ${key}`}><span>{number(row.valeurs?.[key])}</span><Edit3 /></button></td>)}</tr>)}</tbody></table>{!rows.length && <div className="validation-empty">Aucune donnée disponible dans cette table.</div>}</div>}</section> : <FactTablesLanding tables={tables} onOpen={() => setFactTablesOpen(true)} />)}
      {view === 'journal' && (journalOpen ? <><button className="journal-screen__back" type="button" onClick={() => { setJournalOpen(false); setView('overview'); }}><ArrowLeft />Retour à la validation</button><ValidationJournalActions journal={journal} canUndo={canConfigure} onChanged={() => loadWorkspace(true)} /></> : <JournalLanding journal={journal} onOpen={() => setJournalOpen(true)} />)}
      {view === 'configuration' && (configurationOpen ? <><button className="configuration-screen__back" type="button" onClick={() => { setConfigurationOpen(false); setView('overview'); }}><ArrowLeft />Retour à la validation</button><ValidationConfiguration configuration={configuration} canConfigure={canConfigure} onReset={cancelConfiguration} /></> : <ConfigurationLanding configuration={configuration} onOpen={() => setConfigurationOpen(true)} />)}
    </>}
    {selected && <div className="ui-modal-overlay" role="presentation" onMouseDown={() => !saving && setSelected(null)}><form className="ui-modal validation-modal" onSubmit={save} onMouseDown={event => event.stopPropagation()} aria-labelledby="correction-title"><header className="ui-modal-head"><div><p className="validation-modal__eyebrow">{tableLabel(active)}</p><h2 id="correction-title">Modifier l’indicateur {selected.key}</h2></div><button className="ui-button ui-icon-button" type="button" onClick={() => setSelected(null)} disabled={saving} aria-label="Fermer"><X /></button></header><div className="ui-modal-body"><p className="validation-modal__copy">Date : <strong>{date(selected.row.dateReference)}</strong> · {selected.row.agence}</p><div className="validation-preview"><div><span>Ancienne valeur</span><strong>{number(selectedValue)}</strong></div><Plus /><div><span>Nouvelle valeur</span><strong>{number(nextValue)}</strong></div></div><label className="validation-field"><span>Nouvelle valeur</span><input type="number" step="any" autoFocus value={amount} onChange={event => setAmount(event.target.value)} placeholder="Ex. 25" required /></label><label className="validation-field"><span>Motif de la correction</span><textarea value={reason} onChange={event => setReason(event.target.value)} placeholder="Décrivez la raison de cet ajustement…" required minLength="4" /></label></div><footer className="ui-modal-foot"><button className="ui-button ui-button--secondary" type="button" onClick={() => setSelected(null)} disabled={saving}>Annuler</button><button className="ui-button ui-button--primary" type="submit" disabled={!canSave}><CheckCircle2 />{saving ? 'Enregistrement…' : 'Enregistrer la correction'}</button></footer></form></div>}
  </main>;
}

function ValidationOverview({ tables, journal, canConfigure, onOpenTables, onOpenJournal, onOpenConfiguration }) {
  return <section className="validation-hub" aria-label="Espaces de validation"><button className="validation-hub__card validation-hub__card--tables" type="button" onClick={onOpenTables}><span className="validation-hub__icon"><Table2 /></span><span className="validation-hub__copy"><small>CONTRÔLE DES DONNÉES</small><strong>Tables de faits</strong><em>Consultez les {tables.length} tables et corrigez les indicateurs de l’entrepôt UAT.</em></span><span className="validation-hub__arrow"><ArrowRight /></span></button><button className="validation-hub__card validation-hub__card--journal" type="button" onClick={onOpenJournal}><span className="validation-hub__icon"><History /></span><span className="validation-hub__copy"><small>TRAÇABILITÉ</small><strong>Journal des modifications</strong><em>Retrouvez les {journal.length} corrections et annulez celles qui sont autorisées.</em></span><span className="validation-hub__arrow"><ArrowRight /></span></button>{canConfigure && <button className="validation-hub__card validation-hub__card--configuration" type="button" onClick={onOpenConfiguration}><span className="validation-hub__icon"><Settings2 /></span><span className="validation-hub__copy"><small>ENVIRONNEMENT UAT</small><strong>Configuration de validation</strong><em>Vérifiez la base, le schéma, les tables mappées et le journal d’audit.</em></span><span className="validation-hub__arrow"><ArrowRight /></span></button>}</section>;
}

function FactTablesLanding({ tables, onOpen }) {
  return <section className="ui-panel fact-tables-landing">
    <div className="fact-tables-landing__icon"><Table2 /></div>
    <div><p className="validation-modal__eyebrow">ESPACE DÉDIÉ</p><h2 className="ui-panel-title">Tables de faits</h2><p className="ui-panel-copy">Ouvrez le navigateur pour consulter les {tables.length} tables, modifier leurs indicateurs et passer d’une table à l’autre avec les onglets en tête de page.</p></div>
    <button className="ui-button ui-button--primary" type="button" onClick={onOpen}><Table2 />Ouvrir les tables de faits</button>
  </section>;
}

function JournalLanding({ journal, onOpen }) {
  return <section className="ui-panel fact-tables-landing journal-landing"><div className="fact-tables-landing__icon"><History /></div><div><p className="validation-modal__eyebrow">ESPACE DÉDIÉ</p><h2 className="ui-panel-title">Journal des modifications</h2><p className="ui-panel-copy">Consultez les {journal.length} correction{journal.length > 1 ? 's' : ''}, leurs valeurs avant/après et, si nécessaire, annulez une correction autorisée.</p></div><button className="ui-button ui-button--primary" type="button" onClick={onOpen}><History />Ouvrir le journal</button></section>;
}

function ConfigurationLanding({ configuration, onOpen }) {
  return <section className="ui-panel fact-tables-landing configuration-landing"><div className="fact-tables-landing__icon"><Settings2 /></div><div><p className="validation-modal__eyebrow">ESPACE DÉDIÉ</p><h2 className="ui-panel-title">Configuration de validation</h2><p className="ui-panel-copy">Consultez la base UAT, le schéma des tables de faits et le journal d’audit avant de modifier cette configuration.</p></div><button className="ui-button ui-button--primary" type="button" onClick={onOpen}><Settings2 />Ouvrir la configuration</button></section>;
}

function ValidationJournalActions({ journal, canUndo, onChanged, fullScreen = false, onBack }) {
  const [busy, setBusy] = useState(null), [pending, setPending] = useState(null), [error, setError] = useState('');
  const undo = async () => { if (!pending) return; setBusy(pending.id); setError(''); try { await api.undoValidation(pending.id); setPending(null); await onChanged(); } catch (exception) { setError(exception.message); } finally { setBusy(null); } };
  return <><section className="ui-panel validation-journal"><header className="ui-table-card-head"><div><div className="validation-journal__title"><History /><h2 className="ui-panel-title">Journal des modifications</h2></div><p className="ui-panel-copy">Chaque correction conserve son historique et peut être annulée de manière tracée.</p></div><span className="validation-journal__total">{journal.length} entrée{journal.length > 1 ? 's' : ''}</span></header><div className="ui-table-wrap"><table className="ui-table"><thead><tr><th>Table de faits</th><th>Date</th><th>Indicateur</th><th>Ancienne valeur</th><th>Nouvelle valeur</th><th>Modifié par</th><th>Action</th></tr></thead><tbody>{journal.map(item => <tr key={item.id}><td><strong>{item.tableFait.replace('FaitValidation', 'Table ')}</strong></td><td>{date(item.dateReference)}</td><td><span className="validation-indicator">{item.indicateur}</span></td><td>{number(item.ancienneValeur)}</td><td><strong>{number(item.nouvelleValeur)}</strong></td><td className="ui-cell-muted">{item.utilisateur}</td><td>{canUndo && item.statut !== 'ANNULE' ? <button className="ui-button ui-button--secondary" type="button" disabled={busy === item.id} onClick={() => setPending(item)}>↩ Annuler</button> : <span className="ui-cell-muted">{item.statut === 'ANNULE' ? 'Annulée' : '—'}</span>}</td></tr>)}</tbody></table></div></section>{pending && <div className="ui-modal-overlay" role="presentation" onMouseDown={() => !busy && setPending(null)}><section className="ui-modal validation-undo-modal" role="dialog" aria-modal="true" aria-labelledby="undo-title" onMouseDown={event => event.stopPropagation()}><header className="ui-modal-head"><div><p className="validation-modal__eyebrow">Retour arrière sécurisé</p><h2 id="undo-title">Annuler cette correction ?</h2></div></header><div className="ui-modal-body"><p className="validation-modal__copy">La valeur de <strong>{pending.indicateur}</strong> reviendra de <strong>{number(pending.nouvelleValeur)}</strong> à <strong>{number(pending.ancienneValeur)}</strong>.</p>{error && <p className="ui-inline-error">{error}</p>}</div><footer className="ui-modal-foot"><button className="ui-button ui-button--secondary" type="button" disabled={busy} onClick={() => setPending(null)}>Conserver la correction</button><button className="ui-button ui-button--primary" type="button" disabled={busy} onClick={undo}>{busy ? 'Annulation…' : 'Confirmer l’annulation'}</button></footer></section></div>}</>;
}

function ValidationJournal({ journal }) {
  return <section className="ui-panel validation-journal"><header className="ui-table-card-head"><div><div className="validation-journal__title"><History /><h2 className="ui-panel-title">Journal des modifications</h2></div><p className="ui-panel-copy">Chaque ligne est rattachée à la table de faits et à l’indicateur réellement modifiés.</p></div><span className="validation-journal__total">{journal.length} entrée{journal.length > 1 ? 's' : ''}</span></header><div className="ui-table-wrap"><table className="ui-table"><thead><tr><th>Table de faits</th><th>Date</th><th>Indicateur</th><th>Ancienne valeur</th><th>Nouvelle valeur</th><th>Modifié par</th></tr></thead><tbody>{journal.map(item => <tr key={item.id}><td><strong>{item.tableFait.replace('FaitValidation', 'Table ')}</strong></td><td>{date(item.dateReference)}</td><td><span className="validation-indicator">{item.indicateur.replace('Indicateur', 'Indicateur ')}</span></td><td>{number(item.ancienneValeur)}</td><td><strong>{number(item.nouvelleValeur)}</strong></td><td className="ui-cell-muted">{item.utilisateur}</td></tr>)}</tbody></table>{!journal.length && <div className="validation-empty">Aucune correction n’a encore été enregistrée.</div>}</div></section>;
}

function ValidationConfiguration({ configuration, canConfigure, onReset }) {
  return <section className="validation-configuration"><section className="ui-panel validation-configuration__intro"><div><p className="validation-modal__eyebrow">Contexte Validation</p><h2 className="ui-panel-title">Configuration propre à la validation</h2><p className="ui-panel-copy">Cette configuration utilise la même instance SQL Server que l’application, mais elle ne lit aucune source de suivi des chargements.</p></div><div className="validation-configuration__actions"><span className="validation-count"><CheckCircle2 />Indépendante des Sources</span>{canConfigure && <button className="ui-button ui-button--secondary" type="button" onClick={onReset}><Settings2 />Annuler la configuration</button>}</div></section><section className="validation-configuration__grid"><article className="ui-panel validation-configuration__card"><Database /><span>Base de données Validation</span><strong>{configuration?.baseDonnees || 'Chargement…'}</strong><small>{configuration?.serveur || 'Serveur SQL Server'}</small></article><article className="ui-panel validation-configuration__card"><Table2 /><span>Tables de faits</span><strong>{configuration?.tablesDeFaits || 14} tables</strong><small>Schéma {configuration?.schema || 'stg'}</small></article><article className="ui-panel validation-configuration__card"><History /><span>Traçabilité</span><strong>Journal dédié</strong><small>{configuration?.journal || 'dbo.ValidationJournal'}</small></article></section><section className="ui-panel validation-configuration__scope"><h2 className="ui-panel-title">Périmètre de cette configuration</h2><ul><li>Lecture et mise à jour des indicateurs dans les 14 tables de faits du schéma <strong>stg</strong>.</li><li>Journalisation systématique dans <strong>dbo.ValidationJournal</strong>.</li><li>Aucune dépendance à une source configurée dans le module de suivi ETL.</li></ul></section></section>;
}

function ValidationSetup({ canConfigure, onConfigured, fullScreen = false, onBack }) {
  const [server, setServer] = useState(null); const [databases, setDatabases] = useState([]); const [database, setDatabase] = useState(''); const [schema, setSchema] = useState(''); const [journal, setJournal] = useState(''); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  useEffect(() => { Promise.all([api.sourceServer(), api.sourceDatabases()]).then(([info, items]) => { setServer(info); setDatabases(items); }).catch(exception => setError(exception.message || 'Impossible de charger les bases de données.')); }, []);
  const ready = Boolean(database && schema && journal);
  const save = async () => { if (!ready || saving) return; setSaving(true); setError(''); try { await api.configureValidation({ baseDonnees: database, schema, journal }); await onConfigured(); } catch (exception) { setError(exception.message || 'La configuration n’a pas pu être enregistrée.'); } finally { setSaving(false); } };
  if (!canConfigure) return <main className="ui-page validation-page"><section className="ui-panel validation-empty">La validation des données doit d’abord être configurée par un administrateur.</section></main>;
  return <main className="ui-page validation-page"><header className="ui-page-header validation-page__header"><div className="ui-page-heading"><div className="ui-eyebrow"><Settings2 />Configuration indépendante</div><h1>Configurer la validation des données</h1><p>Choisissez la base et le schéma des tables de faits, indépendamment des Sources ETL.</p></div></header><section className="source-configurator ui-panel validation-setup"><header><span><Database /></span><div><small>CONFIGURATION VALIDATION</small><h2>Connecter les tables de faits</h2><p>Les choix suivants sont enregistrés pour le contexte Validation uniquement.</p></div></header><div className="validation-setup__fields"><label><span>Serveur SQL Server</span><div className="source-config-readonly"><Database />{server?.serveur || 'Connexion…'}</div><small>{server?.authentification || 'Windows / Active Directory'}</small></label><label><span>Base de données</span><div className="source-config-select"><Database /><select value={database} onChange={e => { setDatabase(e.target.value); setSchema(''); setJournal(''); }}><option value="">Sélectionner une base…</option>{databases.map(item => <option key={item}>{item}</option>)}</select></div><small>{databases.length} base(s) accessible(s)</small></label><label><span>Schéma des tables</span><div className="source-config-select"><Table2 /><select value={schema} disabled={!database} onChange={e => { setSchema(e.target.value); setJournal(''); }}><option value="">Sélectionner un schéma…</option><option value="stg">stg</option></select></div><small>14 tables FaitValidation attendues</small></label><label><span>Journal de validation</span><div className="source-config-select"><History /><select value={journal} disabled={!schema} onChange={e => setJournal(e.target.value)}><option value="">Sélectionner un journal…</option><option value="dbo.ValidationJournal">dbo.ValidationJournal</option></select></div><small>Ancienne et nouvelle valeur</small></label><button className="ui-button ui-button--primary" type="button" disabled={!ready || saving} onClick={save}><CheckCircle2 />{saving ? 'Validation…' : 'Valider la configuration'}</button></div>{error && <p className="ui-inline-error" role="alert">{error}</p>}</section></main>;
}
