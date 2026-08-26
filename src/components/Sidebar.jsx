import { Bell, ChevronDown, Database, FileText, History, Info, LayoutGrid, LogOut, Menu, Server, Settings, User, Users, Workflow, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import bccLogo from '../assets/bcc-logo.png';
import building from '../assets/bcc-building.jpg';
import BccBrand from './BccBrand';

const navItems = [
  { label: 'Tableau de bord', icon: LayoutGrid },
  { label: 'Suivi des chargements', icon: Database },
  { label: 'Flux ETL', icon: Workflow },
  { label: 'Sources', icon: Server },
  { label: 'Historique', icon: History },
  { label: 'Alertes', icon: Bell },
  { label: 'Rapports', icon: FileText },
  { label: 'Paramètres', icon: Settings },
  { label: 'Utilisateurs', icon: Users, administratorOnly: true },
  { label: 'À propos', icon: Info },
];

export default function Sidebar({ active, setActive, open, setOpen, user, onLogout }) {
  const [profile, setProfile] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  useEffect(() => { setPhotoFailed(false); }, [user?.photoProfil]);
  const isAdministrator = user?.roles?.includes('ADMINISTRATEUR');
  const navigate = item => {
    setActive(item);
    setOpen(false);
    setProfile(false);
  };
  const logout = () => {
    if (window.confirm('Voulez-vous vous déconnecter ?')) onLogout();
  };
  const visibleItems = navItems.filter(item => !item.administratorOnly || isAdministrator);

  return <>
    <button className="mobile-menu" aria-label="Ouvrir le menu" onClick={() => setOpen(true)}><Menu /></button>
    <aside className={`sidebar ${open ? 'open' : ''}`} style={{ '--building': `url(${building})` }}>
      <button className="close-nav" aria-label="Fermer le menu" onClick={() => setOpen(false)}><X /></button>
      <button className="brand" title="Retour au tableau de bord" onClick={() => navigate('Tableau de bord')}><BccBrand /></button>
      <nav>{visibleItems.map(({ label, icon: Icon }) => <button key={label} title={label} className={active === label ? 'active' : ''} aria-current={active === label ? 'page' : undefined} onClick={() => navigate(label)}><Icon /><span>{label}</span></button>)}</nav>
      <div className="sidebar-bottom">
        <button className={`user-card ${active === 'Mon profil' ? 'active' : ''}`} aria-expanded={profile} onClick={() => setProfile(!profile)}><span className={`avatar${user?.photoProfil && !photoFailed ? ' has-photo' : ''}`}>{user?.photoProfil && !photoFailed ? <img src={user.photoProfil} alt="" onError={() => setPhotoFailed(true)} /> : <User />}</span><span className="user-card-copy"><strong>{user?.nomComplet || 'Utilisateur'}</strong><small>{user?.roles?.[0] ? `${user.roles[0].charAt(0)}${user.roles[0].slice(1).toLocaleLowerCase('fr-FR')}` : 'Consultant'}</small></span><span className={`profile-chevron ${profile ? 'open' : ''}`}><ChevronDown /></span></button>
        {profile && <div className="profile-menu"><button onClick={() => navigate('Mon profil')}><User />Voir mon profil</button><button onClick={() => navigate('Paramètres')}><Settings />Paramètres du compte</button></div>}
        <button className="logout" onClick={logout}><LogOut />Déconnexion</button>
      </div>
    </aside>
  </>;
}
