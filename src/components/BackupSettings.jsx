import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Database, HardDrive, Info, LockKeyhole, RefreshCw, ShieldCheck } from 'lucide-react';
import { api } from '../api';

const size = bytes => `${(Number(bytes || 0) / 1024 / 1024).toFixed(1)} Mo`;

export default function BackupSettings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    const startedAt = Date.now();
    setLoading(true);
    setError('');
    try { setItems(await api.backups()); } catch (exception) { setError(exception.message); } finally {
      const remaining = Math.max(0, 1000 - (Date.now() - startedAt));
      if (remaining) await new Promise(resolve => window.setTimeout(resolve, remaining));
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async scope => {
    setCreating(scope);
    setError('');
    setNotice('');
    try {
      const result = await api.createBackup(scope);
      setNotice(`${result.message} ${result.fichier}`);
      await load();
    } catch (exception) {
      setError(exception.message);
    } finally {
      setCreating('');
    }
  };

  return <div className="backup-v2">
    {error && <p className="register-error" role="alert">{error}</p>}
    {notice && <div className="backup-v2-notice"><CheckCircle2 />{notice}</div>}

    <section className="backup-v2-hero">
      <div className="backup-v2-hero-copy"><span><HardDrive /></span><div><small>PROTECTION DES DONNÉES UAT</small><h2>Sauvegardes indépendantes</h2><p>Choisissez le module à sauvegarder. Chaque opération possède son propre journal d’audit.</p></div></div>
      <div className="backup-v2-actions"><button type="button" className="backup-v2-primary" disabled={Boolean(creating)} onClick={() => create('suivi-etl')}><Database />{creating === 'suivi-etl' ? 'Sauvegarde en cours…' : 'Sauvegarder le suivi ETL'}</button><button type="button" className="backup-v2-secondary" disabled={Boolean(creating)} onClick={() => create('validation')}><HardDrive />{creating === 'validation' ? 'Sauvegarde en cours…' : 'Sauvegarder la validation'}</button></div>
    </section>

    <section className="backup-v2-status" aria-label="État du service de sauvegarde">
      <article><span className="is-blue"><Database /></span><div><small>Service</small><b>SQL Server opérationnel</b><p>Sauvegarde complète avec checksum et compression.</p></div></article>
      <article><span className="is-green"><ShieldCheck /></span><div><small>Mode sécurisé</small><b>Copie COPY_ONLY</b><p>La chaîne normale de sauvegardes reste inchangée.</p></div></article>
      <article><span className="is-purple"><LockKeyhole /></span><div><small>Autorisation</small><b>Administrateurs uniquement</b><p>Endpoint protégé par le rôle serveur.</p></div></article>
    </section>

    <section className="backup-v2-history">
      <header><div><h2>Journal des sauvegardes</h2><p>Chaque opération est tracée avec son statut, son utilisateur et son fichier.</p></div><button type="button" className="refresh" disabled={loading} onClick={load}><RefreshCw className={loading ? 'spin' : ''} />{loading ? 'Actualisation…' : 'Actualiser'}</button></header>
      {loading ? <div className="backup-v2-empty">Chargement du journal…</div> : items.length ? <div className="backup-v2-list">{items.map(item => <article key={item.id} className={item.statut === 'ECHEC' ? 'is-error' : ''}><span><Database /></span><div><b>{item.perimetre === 'VALIDATION' ? 'Validation des données' : 'Suivi ETL'} · {item.databaseName}</b><small>{item.fichier} · {item.utilisateur}</small>{item.erreur && <small className="backup-v2-error">{item.erreur}</small>}</div><strong className={item.statut === 'REUSSI' ? 'is-success' : item.statut === 'ECHEC' ? 'is-error' : ''}>{item.statut}</strong><time>{new Date(item.dateFin || item.dateDebut).toLocaleString('fr-FR')} · {item.tailleOctets ? size(item.tailleOctets) : '—'}</time></article>)}</div> : <div className="backup-v2-empty"><HardDrive /><b>Aucune sauvegarde journalisée</b><p>Choisissez un module pour créer sa première copie UAT.</p></div>}
      <footer><Info />Le journal applicatif complète l’historique technique SQL Server. La restauration reste séparée pour éviter tout écrasement accidentel.</footer>
    </section>
  </div>;
}
