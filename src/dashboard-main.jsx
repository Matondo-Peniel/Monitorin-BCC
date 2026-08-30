import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Database, Landmark, Workflow } from 'lucide-react';
import App from './App';
import AuthPage from './components/AuthPage';
import { api } from './api';
import bccLogo from './assets/bcc-logo.png';
import './login-page.css';
import './login-loader.css';

function Root() {
  const [state, setState] = useState({ loading: true, user: null, setup: false });
  useEffect(() => {
    let mounted = true;
    (async () => {
      let nextState;
      try {
        nextState = { loading: false, user: await api.me(), setup: false };
      } catch {
        try {
          const init = await api.initialization();
          nextState = { loading: false, user: null, setup: init.initialisationRequise };
        } catch {
          nextState = { loading: false, user: null, setup: false };
        }
      }
      if (mounted) setState(nextState);
    })();
    return () => { mounted = false; };
  }, []);
  if (state.loading) return <div className="bcc-loading-screen" role="status" aria-live="polite"><div className="bcc-loading-brand"><img src={bccLogo} alt="Banque Centrale du Congo" /></div><div className="bcc-loading-flow" aria-hidden="true"><span className="bcc-loading-stage"><Database /><small>Sources</small></span><i className="bcc-loading-connector" /><span className="bcc-loading-stage"><Workflow /><small>Staging</small></span><i className="bcc-loading-connector" /><span className="bcc-loading-stage"><Landmark /><small>Entrepôt</small></span></div><div className="bcc-loading-copy"><strong>Préparation de votre espace</strong><span>Connexion sécurisée aux services ETL</span></div></div>;
  if (!state.user) return <AuthPage mode={state.setup ? 'setup' : 'login'} onInitialized={() => setState({ loading: false, user: null, setup: false })} onAuthenticated={user => setState({ loading: false, user, setup: false })} />;
  return <App user={state.user} onUserUpdate={user => setState(current => ({ ...current, user }))} onLogout={async () => { await api.logout(); setState({ loading: false, user: null, setup: false }); }} />;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><Root /></React.StrictMode>);
