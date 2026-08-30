import { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardList, Eye, Info, LockKeyhole, Monitor, ShieldCheck, X } from 'lucide-react';
import { api } from '../api';

function Panel({ icon: Icon, title, children }) {
  return <section className="security-panel"><h2><span><Icon /></span>{title}</h2>{children}</section>;
}

function Row({ title, text, children }) {
  return <div className="security-row"><div><b>{title}</b><small>{text}</small></div>{children}</div>;
}

export default function SecuritySettings() {
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [password, setPassword] = useState({ old: '', next: '', confirm: '' });
  const [session, setSession] = useState(null);
  const [audit, setAudit] = useState([]);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  useEffect(() => { api.currentSession().then(setSession).catch(exception => setError(exception.message)); }, []);
  const openAudit = async () => {
    setAuditOpen(true);
    setAuditLoading(true);
    setError('');
    try { setAudit(await api.audit()); } catch (exception) { setError(exception.message); } finally { setAuditLoading(false); }
  };
  const closePassword = () => {
    if (!saving) setPasswordOpen(false);
  };
  const changePassword = async event => {
    event.preventDefault();
    setError('');
    if (password.next !== password.confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setSaving(true);
    try {
      await api.changePassword({ AncienMotDePasse: password.old, NouveauMotDePasse: password.next });
      setNotice('Mot de passe modifié.');
      setPassword({ old: '', next: '', confirm: '' });
      setPasswordOpen(false);
    } catch (exception) {
      setError(exception.message);
    } finally {
      setSaving(false);
    }
  };

  return <div className="security-page">
    {notice && <div className="security-toast"><CheckCircle2 />{notice}</div>}
    {error && <p className="register-error">{error}</p>}
    <div className="security-grid">
      <Panel icon={LockKeyhole} title="Authentification">
        <Row title="Mot de passe" text="Les règles de complexité sont appliquées par ASP.NET Core Identity."><button type="button" className="security-action" onClick={() => setPasswordOpen(true)}><LockKeyhole />Modifier</button></Row>
        <Row title="Authentification à deux facteurs (2FA)" text="L’activation sera proposée lorsqu’un second facteur vérifiable sera configuré."><span>À configurer</span></Row>
        <Row title="Expiration de session" text="Gérée par la politique de cookie serveur."><span>8 heures</span></Row>
        <Row title="Tentatives de connexion échouées" text="Gérées par Identity côté serveur."><span>5 tentatives</span></Row>
      </Panel>
      <Panel icon={ShieldCheck} title="Contrôle d’accès">
        <Row title="Gestion des rôles" text="Réservée aux administrateurs autorisés."><span>Serveur</span></Row>
        <Row title="Principe du moindre privilège" text="Les autorisations sont vérifiées par les contrôleurs API."><span>Actif</span></Row>
        <Row title="Restrictions d’accès par IP" text="Aucun paramètre IP n’est exposé par le backend actuel."><span>Indisponible</span></Row>
      </Panel>
      <Panel icon={ShieldCheck} title="Chiffrement">
        <Row title="Données en transit (SSL/TLS)" text="Protégé par HTTPS selon la configuration serveur."><span>Actif</span></Row>
        <Row title="Données au repos" text="Dépend de la configuration SQL Server de l’environnement."><span>Configuration serveur</span></Row>
        <div className="security-note"><Info />Aucune affirmation de succès n’est affichée sans vérification du serveur.</div>
      </Panel>
      <Panel icon={ClipboardList} title="Journaux et audit">
        <Row title="Journalisation des activités" text="Les actions sensibles sont enregistrées côté backend."><span>Actif</span></Row>
        <Row title="Consultation des journaux" text="Les 100 dernières actions enregistrées sont consultables par un administrateur."><button type="button" className="security-action" onClick={openAudit}><Eye />Consulter</button></Row>
      </Panel>
    </div>
    <section className="security-sessions-card"><h2><span><Monitor /></span>Session active</h2>{session ? <div className="security-current-session"><b>{session.email}</b><span>Adresse IP : {session.adresseIp || 'Locale'}</span><small>{session.navigateur || 'Navigateur non identifié'}</small></div> : <p className="tracking-empty">Chargement de la session…</p>}<footer><span><Info />Session courante protégée par un cookie HTTP-only, expiration après 8 heures.</span></footer></section>
    {auditOpen && <div className="security-modal-back" onClick={() => setAuditOpen(false)}><section className="security-audit-modal" onClick={event => event.stopPropagation()}><button type="button" className="security-audit-close" aria-label="Fermer" onClick={() => setAuditOpen(false)}><X /></button><h2><ClipboardList />Journal d’audit</h2>{auditLoading ? <p>Chargement…</p> : <div className="security-audit-list">{audit.map(entry => <article key={entry.idJournal}><div><b>{entry.action}</b><span>{entry.utilisateur || entry.email || 'Système'}</span></div><small>{entry.details || 'Action enregistrée.'}</small><time>{new Date(entry.dateHeure).toLocaleString('fr-FR')}</time></article>)}{!audit.length && <p>Aucune action enregistrée.</p>}</div>}</section></div>}
    {passwordOpen && <div className="security-modal-back" onClick={closePassword}>
      <form className="security-modal" onSubmit={changePassword} onClick={event => event.stopPropagation()}>
        <button type="button" aria-label="Fermer" onClick={closePassword}><X /></button><LockKeyhole /><h2>Modifier le mot de passe</h2><p>La vérification et le hachage sont réalisés par Identity.</p>
        <label>Mot de passe actuel<input required type="password" value={password.old} onChange={event => setPassword({ ...password, old: event.target.value })} /></label>
        <label>Nouveau mot de passe<input required minLength="8" type="password" value={password.next} onChange={event => setPassword({ ...password, next: event.target.value })} /></label>
        <label>Confirmation<input required minLength="8" type="password" value={password.confirm} onChange={event => setPassword({ ...password, confirm: event.target.value })} /></label>
        <footer><button type="button" onClick={closePassword}>Annuler</button><button type="submit" disabled={saving}>{saving ? 'Modification…' : 'Enregistrer'}</button></footer>
      </form>
    </div>}
  </div>;
}
