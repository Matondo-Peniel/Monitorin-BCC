import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Database, HardDrive, Info, LockKeyhole, RefreshCw, ShieldCheck } from 'lucide-react';
import { api } from '../api';

const size = bytes => `${(Number(bytes || 0) / 1024 / 1024).toFixed(1)} Mo`;

export default function BackupSettings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
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

  const create = async () => {
    setCreating(true);
    setError('');
    setNotice('');
    try {
      const result = await api.createBackup();
      setNotice(`${result.message} ${result.fichier}`);
      await load();
    } catch (exception) {
      setError(exception.message);
    } finally {
      setCreating(false);
    }
  };

  return <div className="backup-v2">
    {error && <p className="register-error" role="alert">{error}</p>}
    {notice && <div className="backup-v2-notice"><CheckCircle2 />{notice}</div>}

    <section className="backup-v2-hero">
      <div className="backup-v2-hero-copy"><span><HardDrive /></span><div><small>PROTECTION DES DONNÉES</small><h2>Sauvegarde SQL Server</h2><p>Créez une copie complète et indépendante de la base MonitoringETL_BCC.</p></div></div>
      <button type="button" className="backup-v2-primary" disabled={creating} onClick={create}><HardDrive />{creating ? 'Sauvegarde en cours…' : 'Créer une sauvegarde'}</button>
    </section>

    <section className="backup-v2-status" aria-label="État du service de sauvegarde">
      <article><span className="is-blue"><Database /></span><div><small>Service</small><b>SQL Server opérationnel</b><p>Sauvegarde complète avec checksum et compression.</p></div></article>
      <article><span className="is-green"><ShieldCheck /></span><div><small>Mode sécurisé</small><b>Copie COPY_ONLY</b><p>La chaîne normale de sauvegardes reste inchangée.</p></div></article>
      <article><span className="is-purple"><LockKeyhole /></span><div><small>Autorisation</small><b>Administrateurs uniquement</b><p>Endpoint protégé par le rôle serveur.</p></div></article>
    </section>

    <section className="backup-v2-history">
      <header><div><h2>Historique des sauvegardes</h2><p>Dernières sauvegardes complètes enregistrées par SQL Server.</p></div><button type="button" className="refresh" disabled={loading} onClick={load}><RefreshCw className={loading ? 'spin' : ''} />{loading ? 'Actualisation…' : 'Actualiser'}</button></header>
      {loading ? <div className="backup-v2-empty">Chargement de l’historique…</div> : items.length ? <div className="backup-v2-list">{items.map(item => <article key={item.id}><span><Database /></span><div><b>{item.databaseName}</b><small>{item.copyOnly ? 'Sauvegarde COPY_ONLY' : 'Sauvegarde complète'}</small></div><strong>{size(item.tailleOctets)}</strong><time>{new Date(item.dateFin || item.dateDebut).toLocaleString('fr-FR')}</time></article>)}</div> : <div className="backup-v2-empty"><HardDrive /><b>Aucune sauvegarde enregistrée</b><p>Utilisez le bouton « Créer une sauvegarde » pour générer la première copie.</p></div>}
      <footer><Info />Les fichiers sont enregistrés dans le répertoire officiel de l’instance. La restauration est volontairement séparée pour éviter tout écrasement accidentel.</footer>
    </section>
  </div>;
}
