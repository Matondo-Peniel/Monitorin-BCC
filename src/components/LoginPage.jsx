import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import logo from '../assets/bcc-logo.png';

export default function LoginPage({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotten, setForgotten] = useState(false);

  const submit = event => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError('Veuillez renseigner votre nom d’utilisateur et votre mot de passe.');
      return;
    }
    setError('');
    setLoading(true);
    window.setTimeout(onLogin, 1800);
  };

  return (
    <main className="bcc-login-page" style={{ '--bcc-logo': `url(${logo})` }}>
      <div className="bcc-logo-pattern" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => <img key={index} src={logo} alt="" />)}
      </div>

      <section className="bcc-login-shell">
        <div className="bcc-login-intro">
          <div className="bcc-login-official">
            <span><img src={logo} alt="Logo de la Banque Centrale du Congo" /></span>
            <p>BANQUE CENTRALE<br /><strong>DU CONGO</strong></p>
          </div>
          <div className="bcc-intro-copy">
            <span className="bcc-platform-tag">PLATEFORME INTERNE</span>
            <h1>Monitoring<br /><em>ETL</em></h1>
            <p>Supervisez vos flux de données avec précision, fiabilité et sécurité.</p>
          </div>
          <div className="bcc-intro-security"><ShieldCheck /><span><b>Accès sécurisé</b><small>Vos données sont protégées</small></span></div>
        </div>

        <form className="bcc-login-form" onSubmit={submit} noValidate>
          <div className="bcc-mobile-brand"><img src={logo} alt="Logo BCC" /><b>BANQUE CENTRALE DU CONGO</b></div>
          <header>
            <span>Heureux de vous revoir</span>
            <h2>Connexion</h2>
            <p>Accédez à votre espace de supervision.</p>
          </header>
          <label className="bcc-field"><span>Nom d’utilisateur</span><div><UserRound /><input autoFocus autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Saisissez votre identifiant" /></div></label>
          <label className="bcc-field"><span>Mot de passe</span><div><LockKeyhole /><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Saisissez votre mot de passe" /><button type="button" aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>
          <div className="bcc-login-options"><label><input type="checkbox" /><span>Se souvenir de moi</span></label><button type="button" onClick={() => setForgotten(true)}>Mot de passe oublié ?</button></div>
          {error && <p className="bcc-login-error" role="alert">{error}</p>}
          <button className="bcc-login-submit" disabled={loading}>Se connecter <ArrowRight /></button>
          <p className="bcc-login-help"><ShieldCheck /> Connexion chiffrée et sécurisée</p>
        </form>
      </section>

      <footer className="bcc-login-footer">© 2026 Banque Centrale du Congo <i /> Direction des Systèmes d’Information</footer>
      {loading && <div className="bcc-loading-screen" role="status" aria-live="polite"><div className="bcc-loading-halo"><span /><img src={logo} alt="Logo BCC" /></div><strong>Chargement</strong><p>Préparation de votre espace sécurisé</p><div className="bcc-loading-dots"><i /><i /><i /></div></div>}
      {forgotten && <div className="bcc-forgotten-backdrop" onClick={() => setForgotten(false)}><section className="bcc-forgotten-card" role="dialog" aria-modal="true" onClick={event => event.stopPropagation()}><ShieldCheck /><h2>Réinitialisation du mot de passe</h2><p>Contactez l’administrateur ETL ou le support DSI afin de recevoir un lien de réinitialisation sécurisé.</p><button onClick={() => setForgotten(false)}>J’ai compris</button></section></div>}
    </main>
  );
}
