import { ArrowLeftRight, Bell, ChevronDown, Database, DatabaseBackup, FileText, History, Info, LayoutGrid, LogOut, Menu, Settings, User, Users, X } from 'lucide-react';
import { useState } from 'react';
import bccLogo from '../assets/bcc-logo.png';
import building from '../assets/bcc-building.jpg';
import { navItems } from '../data/dashboardData';

const icons = [LayoutGrid, Database, ArrowLeftRight, DatabaseBackup, History, Bell, FileText, Settings, Users, Info];
export default function Sidebar({ active, setActive, open, setOpen }) {
  const [profile, setProfile] = useState(false);
  const navigate = item => { setActive(item); setOpen(false); setProfile(false); };
  const logout = () => { if (confirm('Voulez-vous vous déconnecter ?')) location.href = `${location.pathname}?login`; };
  return <><button className="mobile-menu" aria-label="Ouvrir le menu" onClick={() => setOpen(true)}><Menu /></button><aside className={`sidebar ${open ? 'open' : ''}`} style={{ '--building': `url(${building})` }}><button className="close-nav" aria-label="Fermer le menu" onClick={() => setOpen(false)}><X /></button><button className="brand" title="Retour au tableau de bord" onClick={() => navigate('Tableau de bord')}><img src={bccLogo} alt="Banque Centrale du Congo" /><h2>BANQUE CENTRALE<br />DU CONGO</h2></button><nav>{navItems.map((item, index) => { const Icon = icons[index]; return <button key={item} title={item} className={active === item ? 'active' : ''} onClick={() => navigate(item)}><Icon /><span>{item}</span>{item === 'Alertes' && <em>3</em>}</button>; })}</nav><div className="sidebar-bottom"><button className={`user-card ${active === 'Mon profil' ? 'active' : ''}`} aria-expanded={profile} onClick={() => setProfile(!profile)}><span className="avatar"><User /></span><span className="user-card-copy"><strong>Florin Mayala</strong><small>Analyste</small></span><span className={`profile-chevron ${profile ? 'open' : ''}`}><ChevronDown /></span></button>{profile && <div className="profile-menu"><button onClick={() => navigate('Mon profil')}><User />Voir mon profil</button><button onClick={() => navigate('Paramètres')}><Settings />Paramètres du compte</button></div>}<button className="logout" onClick={logout}><LogOut />Déconnexion</button></div></aside></>;
}
