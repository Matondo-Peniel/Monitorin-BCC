import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Database, LoaderCircle, Server, ShieldCheck, Table2 } from 'lucide-react';
import { api } from '../api';

export default function SourceConfigurator({ enabled, onConfigured }) {
  const [server, setServer] = useState(null), [databases, setDatabases] = useState([]), [database, setDatabase] = useState(''), [tables, setTables] = useState([]), [tableKey, setTableKey] = useState(''), [name, setName] = useState('');
  const [loading, setLoading] = useState(false), [saving, setSaving] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  useEffect(() => { if (!enabled) return; setLoading(true); Promise.all([api.sourceServer(), api.sourceDatabases()]).then(([info, items]) => { setServer(info); setDatabases(items); }).catch(e => setError(e.message)).finally(() => setLoading(false)); }, [enabled]);
  useEffect(() => { if (!database) { setTables([]); setTableKey(''); return; } setLoading(true); setError(''); setNotice(''); setTableKey(''); api.sourceTables(database).then(setTables).catch(e => setError(e.message)).finally(() => setLoading(false)); }, [database]);
  const selected = useMemo(() => tables.find(item => `${item.schema}.${item.table}` === tableKey), [tableKey, tables]);
  const save = async event => { event.preventDefault(); if (!selected) return; setSaving(true); setError(''); setNotice(''); try { const result = await api.configureSource({ baseDonnees: database, schema: selected.schema, table: selected.table, nomConnexion: name }); setNotice(result.message); onConfigured?.(result); } catch (e) { setError(e.message); } finally { setSaving(false); } };
  if (!enabled) return null;
  return <section className="source-configurator ui-panel"><header><span><Server /></span><div><small>CONFIGURATION SQL SERVER</small><h2>Choisir la table de suivi ETL</h2><p>Seules les tables possédant le schéma de monitoring obligatoire sont proposées.</p></div>{server && <em><ShieldCheck />Lecture seule</em>}</header><form onSubmit={save}>
    <label><span>Serveur autorisé</span><div className="source-config-readonly"><Server />{server?.serveur || (loading ? 'Connexion…' : 'Indisponible')}</div><small>{server?.authentification}</small></label>
    <label><span>Base de données</span><div className="source-config-select"><Database /><select value={database} disabled={loading} onChange={e => setDatabase(e.target.value)}><option value="">Sélectionner une base…</option>{databases.map(item => <option key={item}>{item}</option>)}</select></div><small>{databases.length} base(s) accessible(s)</small></label>
    <label><span>Table de suivi compatible</span><div className="source-config-select"><Table2 /><select value={tableKey} disabled={!database || loading} onChange={e => setTableKey(e.target.value)}><option value="">{database ? 'Sélectionner la table de suivi…' : 'Choisissez d’abord une base'}</option>{tables.map(item => <option key={`${item.schema}.${item.table}`} value={`${item.schema}.${item.table}`}>{item.schema}.{item.table}</option>)}</select></div><small>{database && !loading && !tables.length ? 'Aucune table compatible trouvée' : 'Colonnes exigées : DateHeureETL, Staging, Entrepot'}</small></label>
    <label><span>Nom d’affichage</span><input value={name} onChange={e => setName(e.target.value)} placeholder={selected ? `${database} — ${selected.table}` : 'Nom généré automatiquement'} /><small>Nom utilisé dans toute la plateforme</small></label>
    <button type="submit" disabled={!selected || saving}>{saving ? <LoaderCircle className="spin" /> : <CheckCircle2 />}{saving ? 'Configuration…' : 'Valider cette source'}</button>
  </form>{error && <p className="source-config-error" role="alert">{error}</p>}{notice && <p className="source-config-notice"><CheckCircle2 />{notice}</p>}</section>;
}
