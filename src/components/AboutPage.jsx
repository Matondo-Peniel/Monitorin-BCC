import { Building2, CircleCheckBig, Clock3, Code2, Eye, FileText, Headphones, Info, LockKeyhole, Mail, Monitor, Phone, ShieldCheck, Target } from 'lucide-react';
import bccLogo from '../assets/bcc-logo.png';

const values = [
  [ShieldCheck, 'Intégrité', 'Nous garantissons l’exactitude et la fiabilité des données.'],
  [LockKeyhole, 'Sécurité', 'La protection des données et des accès est notre priorité.'],
  [Eye, 'Transparence', 'Nous favorisons une vision claire et complète des processus.'],
  [CircleCheckBig, 'Performance', 'Nous visons l’excellence opérationnelle et l’amélioration continue.'],
];

export default function AboutPage() {
  return <div className="about-interface">
    <header className="about-header"><div><h1><Info />À propos</h1><p>Informations sur la plateforme de monitoring des processus ETL.</p></div><div className="about-header-actions"><div className="about-header-logo"><img src={bccLogo} alt="" /><b>BANQUE CENTRALE<br />DU CONGO</b></div></div></header>

    <div className="about-main-grid">
      <section className="card about-hero-card"><div className="about-brand-block"><img src={bccLogo} alt="Logo BCC" /><h2>BANQUE CENTRALE DU CONGO</h2><h3>Plateforme de monitoring des processus ETL</h3><span>Version 1.0.0</span></div><div className="about-description"><p>Cette plateforme permet de surveiller, suivre et analyser l’ensemble des processus ETL (Extract, Transform, Load) assurant l’alimentation du Data Warehouse de la Banque Centrale du Congo.</p><p>Elle offre une visibilité en temps réel sur les sources de données, les chargements, les alertes et l’historique des traitements afin de garantir la qualité, la fiabilité et la disponibilité des données.</p></div><div className="about-mission"><span><Target /></span><div><h3>Notre mission</h3><p>Fournir aux équipes de la BCC un outil fiable et sécurisé pour assurer le monitoring des flux de données et la prise de décision basée sur des informations de qualité.</p></div></div><div className="about-values"><h3><ShieldCheck />Nos valeurs</h3><div>{values.map(([Icon, title, text]) => <article key={title}><Icon /><b>{title}</b><small>{text}</small></article>)}</div></div></section>

      <div className="about-side-stack"><section className="card about-info-card"><h2><Monitor />Informations système</h2><dl><dt>Nom de l’application</dt><dd>BCC - Monitoring ETL</dd><dt>Version</dt><dd>1.0.0</dd><dt>Environnement</dt><dd>Production</dd><dt>Date de déploiement</dt><dd>01/05/2025</dd><dt>Développé par</dt><dd>Sous-direction des Données (DSI)</dd><dt>Haute disponibilité</dt><dd><span>Activée</span></dd><dt>Statut du système</dt><dd className="system-online"><i />Opérationnel</dd></dl></section>
      <section className="card about-tech-card"><h2><Code2 />Technologies utilisées</h2><div><article><span className="sql"><SqlServerMark /></span><b>SQL Server</b></article><article><span className="power"><BarMark /></span><b>Power BI</b></article><article><span className="dotnet">.NET</span><b>.NET</b></article><article><span className="report-builder"><ReportBuilderMark /></span><b>Report Builder</b></article><article><span className="report-server"><ReportServerMark /></span><b>Report Server</b></article></div></section>
      <section className="card about-contact-card"><h2><Headphones />Support et contact</h2><p>Pour toute question, suggestion ou problème technique,<br />veuillez contacter l’équipe support.</p><ul><li><Mail /><a href="mailto:support.etl@bcc.cd">support.etl@bcc.cd</a></li><li><Phone /><a href="tel:+243810000000">+243 81 000 0000</a></li><li><Building2 /><span>Banque Centrale du Congo<br />Boulevard Colonel Tshatshi, Kinshasa / Gombe</span></li><li><Clock3 /><span>Lun - Ven : 07h30 - 16h30</span></li></ul></section></div>
    </div>
    <div className="about-legal-grid"><section className="card"><h2><LockKeyhole />Mentions légales</h2><p>© 2025 Banque Centrale du Congo. Tous droits réservés.<br />Toute reproduction ou distribution non autorisée est interdite.</p></section><section className="card"><h2><FileText />Licence</h2><p>Cette application est la propriété exclusive de la Banque Centrale du Congo<br />et est destinée à un usage interne uniquement.</p></section></div>
  </div>;
}

function BarMark() { return <span className="power-bars"><i /><i /><i /></span>; }
function SqlServerMark() { return <svg viewBox="0 0 64 54" aria-hidden="true"><path d="M13 13c8-7 22-9 37-5-8 1-17 4-24 9-7 5-10 11-9 17-6-7-7-14-4-21Z"/><path d="M17 38c10 5 25 6 37 1-9 7-26 9-39 3-5-2-8-6-8-10 2 3 5 5 10 6Z"/><path d="M24 20c8-6 20-9 31-8-8 3-15 7-20 12-5 5-7 10-6 16-6-6-8-13-5-20Z"/></svg>; }
function ReportBuilderMark() { return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 4 41 13v22L24 44 7 35V13L24 4Z"/><path d="m7 13 17 9 17-9M24 22v22"/><path d="m15 17 9-5 9 5v12l-9 5-9-5V17Z"/></svg>; }
function ReportServerMark() { return <svg viewBox="0 0 42 50" aria-hidden="true"><path d="M8 3h19l9 9v35H8V3Z"/><path d="M27 3v10h9M14 24h16M14 30h16M14 36h11"/><text x="14" y="20">RS</text></svg>; }
