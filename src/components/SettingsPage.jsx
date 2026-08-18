import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Eye, Filter, MoreVertical, Pencil, Plus, RefreshCw, Search, Settings, ShieldCheck, UserCheck, Users, X } from 'lucide-react';
import bccLogo from '../assets/bcc-logo.png';
import BackupSettings from './BackupSettings';
import SecuritySettings from './SecuritySettings';
import NotificationSettings from './NotificationSettings';
import GeneralSettings from './GeneralSettings';
import {api} from '../api';

const initialUsers = [
  ['Florin Mayala', 'f.mayala', 'Administrateur', 'florin.mayala@bcc.cd', 'Actif', '14/05/2025 07:32'],
  ['Patrick Fioti-Fioti Bisambu', 'p.fioti', 'Administrateur', 'patrick.fioti@bcc.cd', 'Actif', '14/05/2025 06:58'],
  ['Nadège Ndala', 'n.ndala', 'Consultant', 'nadege.ndala@bcc.cd', 'Actif', '14/05/2025 07:15'],
  ['Peniel Matondo', 'p.matondo', 'Consultant', 'peniel.matondo@bcc.cd', 'Actif', '14/05/2025 06:43'],
  ['Exauce Nzalampangi', 'e.nzalampangi', 'Consultant', 'exauce.nzalampangi@bcc.cd', 'Actif', '13/05/2025 21:10'],
  ['Taylor Kapita', 't.kapita', 'Consultant', 'taylor.kapita@bcc.cd', 'Inactif', '12/05/2025 18:22'],
  ['Misana Saint', 'm.saint', 'Consultant', 'misana.saint@bcc.cd', 'Actif', '14/05/2025 07:05'],
  ['Kevin Kumwimba', 'k.kumwimba', 'Consultant', 'kevin.kumwimba@bcc.cd', 'Actif', '14/05/2025 06:20'],
];

const tabs = ['Paramètres généraux', 'Notifications', 'Sécurité', 'Sauvegarde'];

export default function SettingsPage({ usersOnly = false, onNavigate, createdUsers = [] }) {
  const [tab, setTab] = useState(usersOnly ? 'Utilisateurs' : 'Paramètres généraux');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('Tous les rôles');
  const [status, setStatus] = useState('Tous les statuts');
  const [modal, setModal] = useState(false);
  const [users, setUsers] = useState(() => [...initialUsers, ...createdUsers.map(user => [user.name, user.username, user.role, user.email, user.active ? 'Actif' : 'Inactif', 'Jamais'])]);
  const [draft, setDraft] = useState({ name: '', username: '', email: '', role: 'Consultant' });
  const [notice, setNotice] = useState('');
  useEffect(()=>{if(usersOnly)api.users().then(items=>setUsers(items.map(item=>[item.nomComplet,item.email?.split('@')[0]||'',item.roles?.[0]==='ADMINISTRATEUR'?'Administrateur':'Consultant',item.email,item.actif?'Actif':'Inactif',item.derniereConnexion?new Date(item.derniereConnexion).toLocaleString('fr-FR'):'Jamais']))).catch(()=>flash('Impossible de charger les utilisateurs depuis le backend.'))},[usersOnly]);
  const flash = text => { setNotice(text); setTimeout(() => setNotice(''), 2200); };
  const filtered = useMemo(() => users.filter(user => `${user[0]} ${user[1]} ${user[3]}`.toLowerCase().includes(query.toLowerCase()) && (role === 'Tous les rôles' || user[2] === role) && (status === 'Tous les statuts' || user[4] === status)), [users, query, role, status]);
  const reset = () => { setQuery(''); setRole('Tous les rôles'); setStatus('Tous les statuts'); };
  const addUser = event => {
    event.preventDefault();
    if (!draft.name || !draft.username || !draft.email) return;
    setUsers([...users, [draft.name, draft.username, draft.role, draft.email, 'Actif', 'Jamais']]);
    setDraft({ name: '', username: '', email: '', role: 'Consultant' });
    setModal(false);
  };

  return <div className="settings-page">{notice && <div className="settings-action-toast"><Check />{notice}</div>}
    <header className="settings-header"><div><h1><Settings />{usersOnly?'Gestion des utilisateurs':tab==='Sauvegarde'?'Paramètres – Sauvegarde':tab==='Sécurité'?'Paramètres – Sécurité':tab==='Notifications'?'Paramètres – Notifications':'Paramètres généraux'}</h1><p>{usersOnly?'Gérez les comptes et les accès des utilisateurs de la plateforme.':tab==='Sauvegarde'?'Configurez et gérez les sauvegardes de la plateforme et des données.':tab==='Sécurité'?'Gérez la sécurité de la plateforme et protégez l’accès aux données.':tab==='Notifications'?'Configurez les préférences de notifications et d’alertes.':'Configurez les paramètres généraux de la plateforme de monitoring ETL.'}</p></div><div className="settings-header-actions"><div className="settings-logo"><img src={bccLogo} alt="" /><b>BANQUE CENTRALE<br />DU CONGO</b></div></div></header>

    <section className={`card settings-shell ${tab === 'Notifications' ? 'notification-active' : ''}`}>{!usersOnly && <nav className="settings-tabs">{tabs.map(item => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</nav>}{tab === 'Utilisateurs' ? <>
      <div className="settings-users-heading"><div><h2>Gestion des utilisateurs</h2><p>Enregistrez et gérez les membres ayant accès à la plateforme de monitoring ETL.</p></div><button className="settings-add" onClick={() => onNavigate?.('Enregistrer un utilisateur')}><Plus />Ajouter un utilisateur</button></div>
      <div className="settings-kpis"><article><span><Users /></span><div><b>Total utilisateurs</b><strong>{users.length}</strong><small>membres enregistrés</small></div></article><article><span className="green"><UserCheck /></span><div><b>Utilisateurs actifs</b><strong>{users.filter(u => u[4] === 'Actif').length}</strong><small>comptes actifs</small></div></article><article><span className="orange"><ShieldCheck /></span><div><b>Administrateurs</b><strong>{users.filter(u => u[2] === 'Administrateur').length}</strong><small>accès administrateur</small></div></article><article><span><Eye /></span><div><b>Consultants</b><strong>{users.filter(u => u[2] === 'Consultant').length}</strong><small>accès en consultation</small></div></article></div>
      <div className="settings-filters"><label><Search /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un utilisateur..." /></label><label><small>Rôle</small><select value={role} onChange={e => setRole(e.target.value)}><option>Tous les rôles</option><option>Administrateur</option><option>Consultant</option></select></label><label><small>Statut</small><select value={status} onChange={e => setStatus(e.target.value)}><option>Tous les statuts</option><option>Actif</option><option>Inactif</option></select></label><button title="Appliquer les filtres" onClick={() => flash(`${filtered.length} utilisateur(s) trouvé(s).`)}><Filter /></button><button title="Réinitialiser" onClick={() => { reset(); flash('Filtres réinitialisés.'); }}><RefreshCw /></button></div>
      <div className="settings-table-wrap"><table><thead><tr><th>Nom complet</th><th>Nom d’utilisateur</th><th>Rôle</th><th>Email</th><th>Statut</th><th>Dernière connexion</th><th>Actions</th></tr></thead><tbody>{filtered.map(user => <tr key={user[1]}><td><b>{user[0]}</b></td><td>{user[1]}</td><td><span className="settings-role">{user[2]}</span></td><td>{user[3]}</td><td><span className={`settings-status ${user[4] === 'Actif' ? 'active' : ''}`}>• {user[4]}</span></td><td>{user[5]}</td><td><div className="settings-row-actions"><button title="Modifier" onClick={() => { setDraft({ name:user[0], username:user[1], email:user[3], role:user[2] }); setModal(true); }}><Pencil /></button><button title="Plus d’actions" onClick={() => flash(`Actions disponibles pour ${user[0]}.`)}><MoreVertical /></button></div></td></tr>)}</tbody></table>{!filtered.length && <div className="settings-empty">Aucun utilisateur trouvé.</div>}</div>
      <footer className="settings-pagination"><span>Affichage 1 à {filtered.length} sur {users.length} utilisateurs</span><div><button disabled><ChevronLeft /></button><b>1</b><button disabled><ChevronRight /></button><select><option>10 par page</option><option>20 par page</option></select></div></footer>
    </> : tab === 'Paramètres généraux' ? <GeneralSettings /> : tab === 'Sauvegarde' ? <BackupSettings /> : tab === 'Sécurité' ? <SecuritySettings /> : tab === 'Notifications' ? <NotificationSettings /> : <div className="settings-placeholder"><Settings /><h2>{tab}</h2><p>Les options de ce module sont prêtes à être configurées.</p></div>}</section>

    {modal && <div className="settings-modal-back" onClick={() => setModal(false)}><form className="settings-modal" onSubmit={addUser} onClick={e => e.stopPropagation()}><button type="button" className="settings-modal-close" onClick={() => setModal(false)}><X /></button><h2>Ajouter un utilisateur</h2><p>Renseignez les informations du nouveau membre.</p><label>Nom complet<input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label><label>Nom d’utilisateur<input value={draft.username} onChange={e => setDraft({ ...draft, username: e.target.value })} /></label><label>Email<input type="email" value={draft.email} onChange={e => setDraft({ ...draft, email: e.target.value })} /></label><label>Rôle<select value={draft.role} onChange={e => setDraft({ ...draft, role: e.target.value })}><option>Consultant</option><option>Administrateur</option></select></label><footer><button type="button" onClick={() => setModal(false)}>Annuler</button><button type="submit"><Check />Ajouter</button></footer></form></div>}
  </div>;
}
