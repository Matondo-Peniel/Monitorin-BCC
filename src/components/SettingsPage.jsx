import { useEffect, useMemo, useState } from 'react';
import { Check, Clock3, Eye, Filter, Mail, MoreVertical, Pencil, Plus, Power, RefreshCw, Search, Settings, ShieldCheck, Trash2, UserCheck, UserCog, UserRound, Users, X } from 'lucide-react';
import bccLogo from '../assets/bcc-logo.png';
import BackupSettings from './BackupSettings';
import SecuritySettings from './SecuritySettings';
import NotificationSettings from './NotificationSettings';
import GeneralSettings from './GeneralSettings';
import CustomSelect from './CustomSelect';
import Pagination from './Pagination';
import { api } from '../api';

const tabs = ['Paramètres généraux', 'Notifications', 'Sécurité', 'Sauvegarde'];
const managedRoles = [
  { value: 'ADMINISTRATEUR', label: 'Administrateur', icon: ShieldCheck },
  { value: 'ANALYSTE', label: 'Analyste', icon: UserCog, tone: 'is-success' },
  { value: 'CONSULTANT', label: 'Consultant', icon: UserRound, tone: 'is-warning' },
];
const roleOptions = [{ value: 'Tous les rôles', label: 'Tous les rôles', icon: Users }, ...managedRoles];
const statusOptions = [{ value: 'Tous les statuts', label: 'Tous les statuts', icon: Filter }, { value: 'Actif', label: 'Actif', icon: Check, tone: 'is-success' }, { value: 'Inactif', label: 'Inactif', icon: Power, tone: 'is-muted' }];
const roleLabel = value => managedRoles.find(role => role.value === String(value || '').toUpperCase())?.label || 'Consultant';
const initials = name => String(name || 'Utilisateur').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();

const toUser = item => ({
  id: item.id,
  name: item.nomComplet,
  username: item.email?.split('@')[0] || '',
  roleKey: String(item.roles?.[0] || 'CONSULTANT').toUpperCase(),
  role: roleLabel(item.roles?.[0]),
  email: item.email,
  status: item.actif ? 'Actif' : 'Inactif',
  lastLogin: item.derniereConnexion ? new Date(item.derniereConnexion).toLocaleString('fr-FR') : 'Jamais',
});

export default function SettingsPage({ usersOnly = false, onNavigate, currentUser, onUserUpdate }) {
  const [tab, setTab] = useState(usersOnly ? 'Utilisateurs' : 'Paramètres généraux');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('Tous les rôles');
  const [status, setStatus] = useState('Tous les statuts');
  const [selectedUser, setSelectedUser] = useState(null);
  const [menuUserId, setMenuUserId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [accountUser, setAccountUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [notice, setNotice] = useState('');
  const [operationError, setOperationError] = useState('');
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const flash = text => { setNotice(text); window.setTimeout(() => setNotice(''), 2600); };
  const loadUsers = async () => {
    const items = await api.users();
    setUsers(items.map(toUser));
  };

  useEffect(() => { if (usersOnly) loadUsers().catch(() => flash('Impossible de charger les utilisateurs depuis le backend.')); }, [usersOnly]);
  useEffect(() => {
    const close = event => {
      if (event.key === 'Escape') {
        setSelectedUser(null);
        setMenuUserId(null);
        setEditingUser(null);
        setAccountUser(null);
        setDeletingUser(null);
      }
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, []);

  const filteredAll = useMemo(() => users.filter(user => (
    `${user.name} ${user.username} ${user.email}`.toLocaleLowerCase('fr-FR').includes(query.toLocaleLowerCase('fr-FR'))
    && (role === 'Tous les rôles' || user.role === role)
    && (status === 'Tous les statuts' || user.status === status)
  )), [users, query, role, status]);
  const pageCount = Math.max(1, Math.ceil(filteredAll.length / pageSize));
  const filtered = useMemo(() => filteredAll.slice((page - 1) * pageSize, page * pageSize), [filteredAll, page]);
  useEffect(() => { setPage(1); }, [query, role, status]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const reset = () => { setQuery(''); setRole('Tous les rôles'); setStatus('Tous les statuts'); };
  const closeOperation = () => { setEditingUser(null); setAccountUser(null); setDeletingUser(null); setOperationError(''); };
  const updateCurrentSession = updated => {
    if (currentUser?.id === updated.id) onUserUpdate?.({ ...currentUser, nomComplet: updated.nomComplet, email: updated.email, roles: updated.roles });
  };

  const saveUser = async values => {
    setSaving(true);
    setOperationError('');
    try {
      const updated = await api.updateUser(editingUser.id, values);
      const mapped = toUser(updated);
      setUsers(items => items.map(item => item.id === mapped.id ? mapped : item));
      updateCurrentSession(updated);
      closeOperation();
      flash('Informations utilisateur mises à jour.');
    } catch (error) {
      setOperationError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const changeAccountStatus = async () => {
    if (!accountUser) return;
    setSaving(true);
    setOperationError('');
    try {
      const activate = accountUser.status !== 'Actif';
      await api.setUserActive(accountUser.id, activate);
      setUsers(items => items.map(item => item.id === accountUser.id ? { ...item, status: activate ? 'Actif' : 'Inactif' } : item));
      closeOperation();
      flash(activate ? 'Compte activé.' : 'Compte désactivé.');
    } catch (error) {
      setOperationError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async () => {
    if (!deletingUser) return;
    setSaving(true);
    setOperationError('');
    try {
      await api.deleteUser(deletingUser.id);
      setUsers(items => items.filter(item => item.id !== deletingUser.id));
      closeOperation();
      flash('Compte utilisateur supprimé.');
    } catch (error) {
      setOperationError(error.message);
    } finally {
      setSaving(false);
    }
  };

  return <div className="settings-page">
    {notice && <div className="settings-action-toast"><Check />{notice}</div>}
    <header className="settings-header">
      <div><h1><Settings />{usersOnly ? 'Gestion des utilisateurs' : tab === 'Sauvegarde' ? 'Paramètres – Sauvegarde' : tab === 'Sécurité' ? 'Paramètres – Sécurité' : tab === 'Notifications' ? 'Paramètres – Notifications' : 'Paramètres généraux'}</h1><p>{usersOnly ? 'Gérez les comptes et les accès des utilisateurs de la plateforme.' : 'Configurez les paramètres généraux de la plateforme de monitoring ETL.'}</p></div>
      <div className="settings-header-actions"><div className="settings-logo"><img src={bccLogo} alt="" /><b>BANQUE CENTRALE<br />DU CONGO</b></div></div>
    </header>
    <section className={`card settings-shell ${tab === 'Notifications' ? 'notification-active' : ''}`}>
      {!usersOnly && <nav className="settings-tabs">{tabs.map(item => <button type="button" key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</nav>}
      {tab === 'Utilisateurs' ? <>
        <div className="settings-users-heading"><div><h2>Gestion des utilisateurs</h2><p>Enregistrez et gérez les membres ayant accès à la plateforme de monitoring ETL.</p></div><button type="button" className="settings-add backup-v2-primary" onClick={() => onNavigate?.('Enregistrer un utilisateur')}><Plus />Ajouter un utilisateur</button></div>
        <div className="settings-kpis settings-kpis--users">
          <Metric icon={Users} title="Total utilisateurs" value={users.length} note="membres enregistrés" />
          <Metric icon={UserCheck} tone="green" title="Utilisateurs actifs" value={users.filter(user => user.status === 'Actif').length} note="comptes actifs" />
          <Metric icon={ShieldCheck} tone="orange" title="Administrateurs" value={users.filter(user => user.roleKey === 'ADMINISTRATEUR').length} note="accès administrateur" />
          <Metric icon={UserCog} tone="green" title="Analystes" value={users.filter(user => user.roleKey === 'ANALYSTE').length} note="analyses et rapports" />
          <Metric icon={Eye} title="Consultants" value={users.filter(user => user.roleKey === 'CONSULTANT').length} note="accès en consultation" />
        </div>
        <div className="settings-filters"><label><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Rechercher un utilisateur..." /></label><CustomSelect label="Rôle" value={role} onChange={setRole} options={roleOptions} icon={ShieldCheck} ariaLabel="Filtrer par rôle" /><CustomSelect label="Statut" value={status} onChange={setStatus} options={statusOptions} icon={UserCheck} ariaLabel="Filtrer par statut" /><button type="button" title="Appliquer les filtres" onClick={() => flash(`${filteredAll.length} utilisateur(s) trouvé(s).`)}><Filter /></button><button type="button" title="Réinitialiser" onClick={() => { reset(); flash('Filtres réinitialisés.'); }}><RefreshCw /></button></div>
        <div className="settings-table-wrap"><table><thead><tr><th>Nom complet</th><th>Nom d’utilisateur</th><th>Rôle</th><th>Email</th><th>Statut</th><th>Dernière connexion</th><th>Actions</th></tr></thead><tbody>{filtered.map(user => <tr key={user.id}><td><b>{user.name}</b></td><td>{user.username}</td><td><span className="settings-role">{user.role}</span></td><td>{user.email}</td><td><span className={`settings-status ${user.status === 'Actif' ? 'active' : ''}`}>• {user.status}</span></td><td>{user.lastLogin}</td><td><div className="settings-row-actions"><button type="button" title="Voir les informations" aria-label={`Voir les informations de ${user.name}`} onClick={() => setSelectedUser(user)}><Eye /></button><div className="user-actions-menu"><button type="button" title="Actions administrateur" aria-label={`Actions administrateur pour ${user.name}`} aria-expanded={menuUserId === user.id} onClick={() => setMenuUserId(current => current === user.id ? null : user.id)}><MoreVertical /></button>{menuUserId === user.id && <div className="user-actions-popover"><button type="button" onClick={() => { setEditingUser(user); setMenuUserId(null); setOperationError(''); }}><Pencil />Modifier</button><button type="button" onClick={() => { setAccountUser(user); setMenuUserId(null); setOperationError(''); }}><Power />Gérer le compte</button><button type="button" className="is-danger" onClick={() => { setDeletingUser(user); setMenuUserId(null); setOperationError(''); }}><Trash2 />Supprimer le compte</button></div>}</div></div></td></tr>)}</tbody></table>{!filtered.length && <div className="settings-empty">Aucun utilisateur trouvé.</div>}</div>
        <Pagination currentPage={page} totalPages={pageCount} totalItems={filteredAll.length} pageSize={pageSize} itemLabel="utilisateur" onPageChange={setPage} />
      </> : tab === 'Paramètres généraux' ? <GeneralSettings /> : tab === 'Sauvegarde' ? <BackupSettings /> : tab === 'Sécurité' ? <SecuritySettings /> : <NotificationSettings />}
    </section>
    {selectedUser && <UserProfileModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
    {editingUser && <EditUserModal user={editingUser} saving={saving} error={operationError} onClose={closeOperation} onSave={saveUser} />}
    {accountUser && <AccountStatusModal user={accountUser} saving={saving} error={operationError} onClose={closeOperation} onConfirm={changeAccountStatus} />}
    {deletingUser && <DeleteUserModal user={deletingUser} saving={saving} error={operationError} onClose={closeOperation} onConfirm={deleteUser} />}
  </div>;
}

function Metric({ icon: Icon, title, value, note, tone = '' }) {
  return <article><span className={tone}><Icon /></span><div><b>{title}</b><strong>{value}</strong><small>{note}</small></div></article>;
}

function ModalShell({ title, copy, children, onClose, icon: Icon }) {
  return <div className="user-admin-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section className="user-admin-modal" role="dialog" aria-modal="true" aria-labelledby="user-admin-modal-title"><header><span><Icon /></span><div><h2 id="user-admin-modal-title">{title}</h2><p>{copy}</p></div><button type="button" aria-label="Fermer" onClick={onClose}><X /></button></header>{children}</section></div>;
}

function EditUserModal({ user, saving, error, onClose, onSave }) {
  const [form, setForm] = useState({ nomComplet: user.name, email: user.email, role: user.roleKey });
  return <ModalShell title="Modifier l’utilisateur" copy="Mettez à jour les informations et le rôle de ce compte." icon={Pencil} onClose={onClose}><form onSubmit={event => { event.preventDefault(); onSave(form); }}><div className="user-admin-form"><label>Nom complet<input value={form.nomComplet} onChange={event => setForm(current => ({ ...current, nomComplet: event.target.value }))} required /></label><label>Adresse email<input type="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} required /></label><div className="user-admin-field"><span>Rôle</span><CustomSelect value={form.role} onChange={value => setForm(current => ({ ...current, role: value }))} options={managedRoles} icon={ShieldCheck} ariaLabel="Rôle de l’utilisateur" /></div></div>{error && <p className="user-admin-error" role="alert">{error}</p>}<footer><button type="button" onClick={onClose} disabled={saving}>Annuler</button><button type="submit" className="is-primary" disabled={saving}><Check />{saving ? 'Enregistrement…' : 'Enregistrer les modifications'}</button></footer></form></ModalShell>;
}

function AccountStatusModal({ user, saving, error, onClose, onConfirm }) {
  const activate = user.status !== 'Actif';
  return <ModalShell title={activate ? 'Activer le compte' : 'Désactiver le compte'} copy={activate ? 'Ce compte pourra de nouveau accéder à la plateforme.' : 'Ce compte ne pourra plus se connecter à la plateforme.'} icon={Power} onClose={onClose}><div className="user-admin-confirm"><span className={activate ? 'is-success' : 'is-warning'}><Power /></span><p><strong>{user.name}</strong><br />Statut actuel : <b>{user.status}</b></p></div>{error && <p className="user-admin-error" role="alert">{error}</p>}<footer><button type="button" onClick={onClose} disabled={saving}>Annuler</button><button type="button" className={activate ? 'is-primary' : 'is-warning'} disabled={saving} onClick={onConfirm}><Power />{saving ? 'Traitement…' : activate ? 'Activer le compte' : 'Désactiver le compte'}</button></footer></ModalShell>;
}

function DeleteUserModal({ user, saving, error, onClose, onConfirm }) {
  return <ModalShell title="Supprimer le compte" copy="Cette action supprime définitivement le compte et ne peut pas être annulée." icon={Trash2} onClose={onClose}><div className="user-admin-confirm user-admin-confirm--danger"><span><Trash2 /></span><p>Confirmez la suppression de <strong>{user.name}</strong>.<br />L’accès de cet utilisateur sera retiré définitivement.</p></div>{error && <p className="user-admin-error" role="alert">{error}</p>}<footer><button type="button" onClick={onClose} disabled={saving}>Annuler</button><button type="button" className="is-danger" disabled={saving} onClick={onConfirm}><Trash2 />{saving ? 'Suppression…' : 'Supprimer définitivement'}</button></footer></ModalShell>;
}

function UserProfileModal({ user, onClose }) {
  return <div className="user-profile-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section className="user-profile-modal" role="dialog" aria-modal="true" aria-labelledby="user-profile-title"><header className="user-profile-modal-head"><div><h2 id="user-profile-title">Informations utilisateur</h2><p>Consultez les informations et les accès de ce compte.</p></div><button type="button" className="user-profile-modal-close" aria-label="Fermer les informations utilisateur" onClick={onClose}><X /></button></header><div className="user-profile-identity"><span className="user-profile-avatar"><UserRound aria-hidden="true" /><b>{initials(user.name)}</b></span><div><h3>{user.name}</h3><div><span className="settings-role">{user.role}</span><span className={`user-profile-status ${user.status === 'Actif' ? 'is-active' : ''}`}>• {user.status}</span></div></div></div><section className="user-profile-details"><h4>Informations du compte</h4><dl><InfoRow label="Nom d’utilisateur" value={user.username} icon={UserRound} /><InfoRow label="Email" value={user.email} icon={Mail} /><InfoRow label="Rôle" value={user.role} icon={ShieldCheck} /><InfoRow label="Statut" value={user.status} icon={Check} tone={user.status === 'Actif' ? 'is-active' : ''} /><InfoRow label="Dernière connexion" value={user.lastLogin} icon={Clock3} /></dl></section><footer className="user-profile-modal-foot"><button type="button" onClick={onClose}>Fermer</button></footer></section></div>;
}

function InfoRow({ label, value, icon: Icon, tone = '' }) { return <div><dt><Icon />{label}</dt><dd className={tone}>{value || 'Non renseigné'}</dd></div>; }
