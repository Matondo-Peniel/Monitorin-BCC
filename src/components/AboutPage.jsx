import { useEffect, useState } from 'react';
import { Building2, CircleCheckBig, Eye, FileText, Headphones, Info, LockKeyhole, Mail, Mailbox, MapPin, Monitor, ShieldCheck, Target } from 'lucide-react';
import bccLogo from '../assets/bcc-logo.png';
import { api } from '../api';

const values = [
  [ShieldCheck, 'Intégrité', 'Nous garantissons l’exactitude et la fiabilité des données.'],
  [LockKeyhole, 'Sécurité', 'La protection des données et des accès est notre priorité.'],
  [Eye, 'Transparence', 'Nous favorisons une vision claire et complète des processus.'],
  [CircleCheckBig, 'Performance', 'Nous visons l’excellence opérationnelle et l’amélioration continue.'],
];

export default function AboutPage() {
  const [health, setHealth] = useState({ loading: true, available: false });
  useEffect(() => {
    let active = true;
    api.health().then(result => { if (active) setHealth({ loading: false, available: result.status === 'OK', database: result.database }); }).catch(() => { if (active) setHealth({ loading: false, available: false }); });
    return () => { active = false; };
  }, []);
  const systemStatus = health.loading ? 'Vérification…' : health.available ? 'API et base disponibles' : 'Non disponible';
  return <div className="about-interface">
    <header className="about-header"><div><h1><Info />À propos</h1><p>Informations sur la plateforme de monitoring des processus ETL.</p></div><div className="about-header-actions"><div className="about-header-logo"><img src={bccLogo} alt="" /><b>BANQUE CENTRALE<br />DU CONGO</b></div></div></header>

    <div className="about-main-grid">
      <section className="card about-hero-card"><div className="about-brand-block"><img src={bccLogo} alt="Logo BCC" /><h2>BANQUE CENTRALE DU CONGO</h2><h3>Plateforme de monitoring des processus ETL</h3><span>Version 1.0.0</span></div><div className="about-description"><p>Cette plateforme permet de surveiller, suivre et analyser l’ensemble des processus ETL (Extract, Transform, Load) assurant l’alimentation du Data Warehouse de la Banque Centrale du Congo.</p><p>Elle offre une visibilité en temps réel sur les sources de données, les chargements, les alertes et l’historique des traitements afin de garantir la qualité, la fiabilité et la disponibilité des données.</p></div><div className="about-mission"><span><Target /></span><div><h3>Notre mission</h3><p>Fournir aux équipes de la BCC un outil fiable et sécurisé pour assurer le monitoring des flux de données et la prise de décision basée sur des informations de qualité.</p></div></div><div className="about-values"><h3><ShieldCheck />Nos valeurs</h3><div>{values.map(([Icon, title, text]) => <article key={title}><Icon /><b>{title}</b><small>{text}</small></article>)}</div></div></section>

      <div className="about-side-stack"><section className="card about-info-card"><h2><Monitor />Informations système</h2><dl><dt>Nom de l’application</dt><dd>BCC - Monitoring ETL</dd><dt>Version</dt><dd>Non disponible</dd><dt>Environnement</dt><dd>Non disponible</dd><dt>Date de déploiement</dt><dd>Non disponible</dd><dt>Développé par</dt><dd>Sous-direction des Données (DSI)</dd><dt>Base de données</dt><dd>{health.database || 'Non disponible'}</dd><dt>Statut du système</dt><dd className={health.available ? 'system-online' : ''}><i />{systemStatus}</dd></dl></section>
      <section className="card about-contact-card"><h2><Headphones />Support et contact</h2><p>Pour toute demande de renseignements ou d’assistance, veuillez contacter la Banque Centrale du Congo.</p><ul><li><Mail /><span><small>E-mail</small><a href="mailto:contact@bcc.cd">contact@bcc.cd</a></span></li><li><MapPin /><span><small>Adresse</small>563, Boulevard Colonel Tshiatshi<br />Gombe, Kinshasa</span></li><li><Mailbox /><span><small>Boîte postale</small>BP 2697 Kinshasa 1</span></li><li><Building2 /><span><small>Pays</small>République Démocratique du Congo</span></li></ul></section></div>
    </div>
    <div className="about-legal-grid"><section className="card"><h2><LockKeyhole />Mentions légales</h2><p>© 2026 Banque Centrale du Congo. Tous droits réservés.<br />Toute reproduction ou distribution non autorisée est interdite.</p></section><section className="card"><h2><FileText />Licence</h2><p>Cette application est la propriété exclusive de la Banque Centrale du Congo<br />et est destinée à un usage interne uniquement.</p></section></div>
  </div>;
}
