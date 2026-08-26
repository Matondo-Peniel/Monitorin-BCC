import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck, UserRound, X } from 'lucide-react';
import logo from '../assets/bcc-logo.png';
import { api } from '../api';

export default function AuthPage({ mode = 'login', onAuthenticated, onInitialized }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordAction, setPasswordAction] = useState(null);
  const [actionToken, setActionToken] = useState('');
  const [actionPassword, setActionPassword] = useState('');
  const [actionConfirm, setActionConfirm] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionNotice, setActionNotice] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const closePasswordAction = (force = false) => {
    if (actionLoading && !force) return;
    setPasswordAction(null);
    setActionError('');
    setActionNotice('');
    setActionToken('');
    setActionPassword('');
    setActionConfirm('');
  };

  async function submit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!email.trim() || !password) {
      setError('Veuillez renseigner votre adresse email et votre mot de passe.');
      return;
    }
    if (mode === 'setup' && password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (mode === 'setup' && (!name.trim() || password !== confirmPassword)) {
      setError(!name.trim() ? 'Le nom complet est obligatoire.' : 'Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'setup') {
        await api.setup({ nomComplet: name, email, motDePasse: password });
        onInitialized();
      } else {
        onAuthenticated(await api.login({ email, motDePasse: password, seSouvenir: remember }));
      }
    } catch (exception) {
      setError(exception.message);
    } finally {
      setLoading(false);
    }
  }

  async function forgot() {
    setError('');
    setNotice('');
    if (!email.trim()) {
      setError('Saisissez votre email avant de demander une réinitialisation.');
      return;
    }
    setLoading(true);
    try {
      const result = await api.forgot(email.trim());
      setActionToken(result.token || '');
      setActionNotice(result.token ? 'Environnement de développement : le jeton a été renseigné automatiquement.' : result.message);
      setPasswordAction('reset');
    } catch (exception) {
      setError(exception.message);
    } finally {
      setLoading(false);
    }
  }

  function openInvitation() {
    setError('');
    setNotice('');
    setActionError('');
    setActionNotice('Saisissez l’adresse email et le code transmis avec votre invitation.');
    setPasswordAction('invitation');
  }

  async function submitPasswordAction(event) {
    event.preventDefault();
    setActionError('');
    if (!email.trim() || !actionToken.trim() || !actionPassword) {
      setActionError('Renseignez l’email, le code et le nouveau mot de passe.');
      return;
    }
    if (actionPassword.length < 8) {
      setActionError('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }
    if (actionPassword !== actionConfirm) {
      setActionError('Les mots de passe ne correspondent pas.');
      return;
    }
    setActionLoading(true);
    try {
      const data = { email: email.trim(), token: actionToken.trim(), nouveauMotDePasse: actionPassword };
      const result = passwordAction === 'invitation' ? await api.activateInvitation(data) : await api.reset(data);
      setNotice(result.message);
      closePasswordAction(true);
    } catch (exception) {
      setActionError(exception.message);
    } finally {
      setActionLoading(false);
    }
  }

  const actionTitle = passwordAction === 'invitation' ? 'Activer mon invitation' : 'Réinitialiser le mot de passe';
  const actionCopy = passwordAction === 'invitation'
    ? 'Choisissez votre mot de passe pour activer votre compte.'
    : 'Définissez un nouveau mot de passe sécurisé pour votre compte.';

  return <main className="bcc-login-page" style={{ '--bcc-logo': `url(${logo})` }}>
    <div className="bcc-logo-pattern" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <img key={index} src={logo} alt="" />)}</div>
    <section className="bcc-login-shell">
      <div className="bcc-login-intro">
        <div className="bcc-login-official"><span><img src={logo} alt="Logo de la Banque Centrale du Congo" /></span><p>BANQUE CENTRALE<br /><strong>DU CONGO</strong></p></div>
        <div className="bcc-intro-copy"><span className="bcc-platform-tag">PLATEFORME INTERNE</span><h1>Monitoring<br /><em>ETL</em></h1><p>Supervisez vos flux de données avec précision, fiabilité et sécurité.</p></div>
        <div className="bcc-intro-security"><ShieldCheck /><span><b>Accès sécurisé</b><small>Vos données sont protégées</small></span></div>
      </div>
      <form className="bcc-login-form" onSubmit={submit} noValidate>
        <div className="bcc-mobile-brand"><img src={logo} alt="Logo BCC" /><b>BANQUE CENTRALE DU CONGO</b></div>
        <header><span>{mode === 'setup' ? 'Première ouverture' : 'Heureux de vous revoir'}</span><h2>{mode === 'setup' ? 'Initialisation' : 'Connexion'}</h2><p>{mode === 'setup' ? 'Créez le premier compte administrateur sécurisé.' : 'Accédez à votre espace de supervision.'}</p></header>
        {mode === 'setup' && <label className="bcc-field"><span>Nom complet</span><div><UserRound /><input autoFocus autoComplete="name" value={name} onChange={event => setName(event.target.value)} placeholder="Votre nom complet" /></div></label>}
        <label className="bcc-field"><span>Adresse email</span><div><UserRound /><input autoFocus={mode === 'login'} type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} placeholder="nom@bcc.cd" /></div></label>
        <label className="bcc-field"><span>Mot de passe</span><div><LockKeyhole /><input type={showPassword ? 'text' : 'password'} minLength={mode === 'setup' ? 8 : undefined} autoComplete={mode === 'setup' ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} placeholder={mode === 'setup' ? '8 caractères minimum' : 'Saisissez votre mot de passe'} /><button type="button" aria-label="Afficher ou masquer le mot de passe" onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>
        {mode === 'setup' && <label className="bcc-field"><span>Confirmer le mot de passe</span><div><LockKeyhole /><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Confirmez le mot de passe" /></div></label>}
        {mode === 'login' && <div className="bcc-login-options"><label><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} /><span>Se souvenir de moi</span></label><span className="bcc-login-links"><button type="button" onClick={forgot}>Mot de passe oublié ?</button><button type="button" onClick={openInvitation}>Activer une invitation</button></span></div>}
        {error && <p className="bcc-login-error" role="alert">{error}</p>}
        {notice && <p className="bcc-login-notice" role="status">{notice}</p>}
        <button className="bcc-login-submit" disabled={loading}>{loading ? 'Veuillez patienter…' : mode === 'setup' ? 'Créer mon compte' : 'Se connecter'} {!loading && <ArrowRight />}</button>
        <p className="bcc-login-help"><ShieldCheck /> Connexion sécurisée par ASP.NET Core Identity</p>
      </form>
    </section>
    <footer className="bcc-login-footer">© 2026 Banque Centrale du Congo <i /> Direction des Systèmes d’Information</footer>
    {passwordAction && <div className="bcc-auth-dialog-backdrop" onMouseDown={() => closePasswordAction()}>
      <section className="bcc-auth-dialog" role="dialog" aria-modal="true" aria-labelledby="password-action-title" onMouseDown={event => event.stopPropagation()}>
        <button className="bcc-auth-dialog-close" type="button" aria-label="Fermer" onClick={() => closePasswordAction()}><X /></button>
        <span className="bcc-auth-dialog-icon"><ShieldCheck /></span><h2 id="password-action-title">{actionTitle}</h2><p>{actionCopy}</p>
        {actionNotice && <p className="bcc-auth-dialog-notice">{actionNotice}</p>}
        <form onSubmit={submitPasswordAction} noValidate>
          <label className="bcc-field"><span>Adresse email</span><div><UserRound /><input type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} placeholder="nom@bcc.cd" /></div></label>
          <label className="bcc-field"><span>{passwordAction === 'invitation' ? 'Code d’invitation' : 'Code de réinitialisation'}</span><div><KeyRound /><input autoComplete="one-time-code" inputMode={passwordAction === 'invitation' ? 'numeric' : undefined} maxLength={passwordAction === 'invitation' ? 10 : undefined} value={actionToken} onChange={event => setActionToken(passwordAction === 'invitation' ? event.target.value.replace(/\D/g, '').slice(0, 10) : event.target.value)} placeholder={passwordAction === 'invitation' ? 'Code numérique (10 chiffres max.)' : 'Collez le code reçu'} /></div></label>
          <label className="bcc-field"><span>Nouveau mot de passe</span><div><LockKeyhole /><input type={showPassword ? 'text' : 'password'} minLength="8" autoComplete="new-password" value={actionPassword} onChange={event => setActionPassword(event.target.value)} placeholder="8 caractères minimum" /><button type="button" aria-label="Afficher ou masquer le mot de passe" onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>
          <label className="bcc-field"><span>Confirmer le mot de passe</span><div><LockKeyhole /><input type={showPassword ? 'text' : 'password'} minLength="8" autoComplete="new-password" value={actionConfirm} onChange={event => setActionConfirm(event.target.value)} placeholder="Confirmez le mot de passe" /></div></label>
          {actionError && <p className="bcc-login-error" role="alert">{actionError}</p>}
          <button className="bcc-login-submit" disabled={actionLoading}>{actionLoading ? 'Veuillez patienter…' : passwordAction === 'invitation' ? 'Activer mon compte' : 'Enregistrer le mot de passe'} {!actionLoading && <ArrowRight />}</button>
        </form>
      </section>
    </div>}
  </main>;
}
