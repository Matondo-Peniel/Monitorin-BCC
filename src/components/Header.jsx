import bccLogo from '../assets/bcc-logo.png';
import GlobalDateControls from './GlobalDateControls';

export default function Header({ user, onRefresh, refreshing = false }) {
  return <header className="topbar">
    <div><h1>Bonjour, {user?.nomComplet || 'Utilisateur'}</h1><p>Bienvenue sur la plateforme de monitoring des processus ETL</p></div>
    <div className="top-actions">
      <GlobalDateControls onRefresh={onRefresh} refreshing={refreshing} />
      <button type="button" className="top-logo" title="Retour en haut" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><img src={bccLogo} alt="Banque Centrale du Congo" /><b>BANQUE CENTRALE<br />DU CONGO</b></button>
    </div>
  </header>;
}
