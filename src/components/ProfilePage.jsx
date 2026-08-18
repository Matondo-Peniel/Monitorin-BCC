import { useRef, useState } from 'react';
import { AlertTriangle, Bell, CalendarDays, Check, Clock3, Database, FileText, Globe2, History, Info, Languages, Laptop, LockKeyhole, Mail, Monitor, Pencil, ShieldCheck, Upload, User, UserCircle } from 'lucide-react';
import bccLogo from '../assets/bcc-logo.png';
import defaultPortrait from '../assets/profile-portrait.png';

const profileRows = [
  [User, 'Nom complet', 'MAYALA KILONGA NZAMBI FLORIN'],
  [Mail, 'Email', 'florin.mayala@bcc.cd'],
  [UserCircle, 'Identifiant', 'f.mayala'],
  [ShieldCheck, 'Rôle', 'Analyste', 'tag'],
  [Info, 'Statut du compte', 'Actif', 'active'],
  [CalendarDays, 'Date de création du compte', '05/05/2025'],
  [Clock3, 'Dernière connexion', '14/05/2025 à 07:32'],
  [Languages, 'Langue', 'Français'],
  [Globe2, 'Fuseau horaire', '(UTC+01:00) Bruxelles, Kinshasa'],
];

const activities = [
  [Check, 'Connexion réussie', 'Connexion à la plateforme', '14/05/2025 07:32', 'green'],
  [FileText, 'Rapport consulté', 'Rapport "Suivi des chargements"', '14/05/2025 07:20', 'blue'],
  [Database, 'Source consultée', 'Source "Core Banking"', '14/05/2025 07:15', 'purple'],
  [Bell, 'Alerte consultée', 'Alerte "Échec de chargement"', '14/05/2025 06:58', 'orange'],
];

export default function ProfilePage({ onNavigate }) {
  const [portrait, setPortrait] = useState(defaultPortrait);
  const fileRef = useRef(null);
  const changePhoto = event => {
    const file = event.target.files?.[0];
    if (file && file.size <= 2 * 1024 * 1024) setPortrait(URL.createObjectURL(file));
  };

  return <div className="profile-page">
    <header className="profile-header">
      <div><h1><User /> Mon profil</h1><p>Consultez vos informations de profil. <b>Seule votre photo peut être modifiée.</b></p></div>
      <div className="profile-head-actions"><div className="profile-logo"><img src={bccLogo} alt="" /><b>BANQUE CENTRALE<br />DU CONGO</b></div></div>
    </header>

    <div className="profile-top-grid">
      <section className="card profile-main-card">
        <div className="profile-photo-column"><div className="profile-photo"><img src={portrait} alt="Florin Mayala" /><button onClick={() => fileRef.current?.click()} aria-label="Modifier la photo"><Pencil /></button></div><input ref={fileRef} hidden type="file" accept="image/png,image/jpeg,image/gif" onChange={changePhoto} /><button className="photo-upload" onClick={() => fileRef.current?.click()}><Upload /><b>Changer ma photo</b><small>JPG, PNG ou GIF. Taille max 2Mo.</small></button></div>
        <div className="profile-identity"><h2>MAYALA KILONGA NZAMBI FLORIN</h2><span className="profile-role">Analyste</span><dl>{profileRows.map(([Icon, label, value, type]) => <div key={label}><dt><Icon />{label}</dt><dd className={type || ''}>{type === 'active' && <i />}{value}</dd></div>)}</dl><div className="profile-admin-note"><Info /><span>Pour toute modification de vos informations (nom, email, rôle, accès...),<br />veuillez contacter l’administrateur de la plateforme.</span></div></div>
      </section>

      <aside className="card profile-account-card"><h2><span><ShieldCheck /></span>À propos de votre compte</h2><p>Les informations de votre compte sont gérées par l’administrateur afin d’assurer la sécurité de la plateforme.</p><h3><LockKeyhole />Gestion des accès</h3><p>L’attribution des rôles et des permissions est réservée uniquement à l’administrateur.</p><h3>Vos permissions actuelles</h3><ul><li>Consultation des sources</li><li>Suivi des chargements</li><li>Consultation des rapports</li></ul></aside>
    </div>

    <div className="profile-bottom-grid">
      <section className="card profile-activity"><h2><span><History /></span>Activité récente</h2>{activities.map(([Icon, title, sub, time, tone]) => <article key={title}><span className={tone}><Icon /></span><div><b>{title}</b><small>{sub}</small></div><time className={tone}>{time}</time></article>)}<button onClick={() => onNavigate('Historique')}>Voir tout l’historique <span>→</span></button></section>
      <section className="card profile-sessions"><h2><span><Monitor /></span>Sessions actives</h2><div className="session-table"><div className="session-head"><b>Appareil / Navigateur</b><b>Localisation</b><b>Connexion</b><b>Statut</b></div>{[
        ['Windows / Chrome 125', 'Kinshasa, RDC', '14/05/2025 07:32', 'En ligne', true, '196.12.45.78'],
        ['Android / Chrome Mobile', 'Kinshasa, RDC', '14/05/2025 06:15', 'Terminée', false, '102.16.8.15'],
        ['Windows / Edge 124', 'Kinshasa, RDC', '13/05/2025 21:10', 'Terminée', false, '196.12.45.78'],
      ].map(([device, place, connection, status, online, ip]) => <div className="session-row" key={device}><span><i className={online ? 'online' : ''} />{device}{online && <small>Session actuelle</small>}</span><span>{place}<small>{ip}</small></span><span>{connection}</span><span className={online ? 'session-online' : 'session-ended'}>{status}</span></div>)}</div><footer>Seules les sessions des 7 derniers jours sont affichées.</footer></section>
    </div>
  </div>;
}
