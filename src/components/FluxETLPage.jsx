import { useState } from 'react';
import { ArrowRight, BarChart3, CalendarDays, Check, ChevronDown, Clock3, CloudUpload, Database, Info, RefreshCw, Settings, Shuffle, Warehouse, X } from 'lucide-react';
import bccLogo from '../assets/bcc-logo.png';

const recent = [
  ['Core Banking → Staging', 'Chargement terminé', '07:31:22', true],
  ['Change → Staging', 'Chargement terminé', '07:30:48', true],
  ['Paiements → Entrepôt', 'Erreur de transformation', '07:30:35', false],
  ['Trésorerie → Entrepôt', 'Chargement terminé', '07:30:12', true],
  ['Comptabilité → Entrepôt', 'Chargement terminé', '07:29:58', true],
];

const stages = [
  ['SOURCES', '10 sources', Database, true],
  ['STAGING AREA', 'Zone d’intégration', Database, true],
  ['DATA WAREHOUSE', 'Entrepôt de données', Warehouse, true],
  ['TABLEAUX DE BORD', 'Reporting & Analytics', BarChart3, null],
];

export default function FluxETLPage({ onNavigate }) {
  const [refreshing, setRefreshing] = useState(false);
  const [date, setDate] = useState('2025-05-14');
  const [calendar, setCalendar] = useState(false);
  const [selected, setSelected] = useState(null);
  const refresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 700); };
  const dateLabel = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date + 'T12:00:00'));

  return <div className="flux-page">
    <header className="flux-header"><div><h1>Flux ETL</h1><p>Visualisez le flux et l’état de vos processus ETL en temps réel</p></div><div className="flux-actions top-actions"><div className="date-control"><button className="date-box" onClick={() => setCalendar(!calendar)}><CalendarDays /><span>{dateLabel}</span><ChevronDown /></button>{calendar && <div className="date-popover"><b>Choisir une date</b><input type="date" value={date} onChange={event => setDate(event.target.value)} /><button onClick={() => setCalendar(false)}>Valider</button></div>}</div><button className="refresh" onClick={refresh}><RefreshCw className={refreshing ? 'spin' : ''} /> Actualiser</button><button className="top-logo" title="Banque Centrale du Congo"><img src={bccLogo} alt="" /><b>BANQUE CENTRALE<br />DU CONGO</b></button></div></header>

    <section className="card flux-global"><h2>Flux ETL global</h2><div className="pipeline">
      {stages.map(([name, subtitle, Icon, state], index) => <div className="pipeline-unit" key={name}>
        <button className={`pipeline-card ${state ? 'complete' : ''} ${selected === name ? 'selected' : ''}`} onClick={() => setSelected(selected === name ? null : name)}><b>{name}</b><small>{subtitle}</small><span><Icon /></span>{state && <i><Check /></i>}</button>
        {index < stages.length - 1 && <div className="pipeline-link"><ArrowRight />{index < 2 && <strong>{index === 0 ? '10 / 10' : '8 / 10'}<small>{index === 0 ? 'Réussi' : 'Réussi'}</small><em>{index === 0 ? '(100%)' : '(80%)'}</em></strong>}</div>}
      </div>)}
    </div><div className="pipeline-feedback">
      <svg viewBox="0 0 1000 66" preserveAspectRatio="none" aria-hidden="true">
        <path className="feedback-line" d="M84 4 V34 H361 V4" />
        <path className="feedback-line" d="M407 4 V34 H640 V4" />
        <path className="feedback-head" d="M78 10 L84 4 L90 10" />
        <path className="feedback-head" d="M355 10 L361 4 L367 10" />
        <path className="feedback-head" d="M401 10 L407 4 L413 10" />
        <path className="feedback-head" d="M634 10 L640 4 L646 10" />
      </svg>
      <small className="feedback-one"><Clock3 /><span>Dernier chargement : 07:31:26<br />Durée : 00:02:31</span></small>
      <small className="feedback-two"><Clock3 /><span>Dernier chargement : 07:31:56<br />Durée : 00:03:21</span></small>
    </div></section>

    <section className="flux-grid">
      <section className="card stage-status"><h2>Statut par étape</h2>{[
        [Shuffle, 'Sources → Staging', 'Chargement des données sources', '10 / 10', 'Réussi', 100],
        [Database, 'Staging → Entrepôt', 'Intégration vers le Data Warehouse', '8 / 10', 'Échoué', 80],
        [Settings, 'Transformations', 'Nettoyage & transformation des données', '8 / 10', 'Réussi', 80],
        [CloudUpload, 'Chargement DW', 'Insertion dans l’entrepôt', '8 / 10', 'Réussi', 80],
      ].map(([Icon, title, sub, count, state, progress]) => <button className={`status-row ${state === 'Échoué' ? 'failed' : ''}`} key={title} onClick={() => setSelected(title)}><span><Icon /></span><div><b>{title}</b><small>{sub}</small><i><em style={{ width: `${progress}%` }} /></i></div><strong>{count}<small className={state === 'Échoué' ? 'failed-text' : ''}>{state}</small><em>{progress}%</em></strong></button>)}</section>

      <section className="card flux-summary"><h2>Résumé du flux ETL</h2><div>{[
        [Check, '18', 'Étapes réussies', 'green'], [X, '2', 'Étapes échouées', 'red'], [Database, '10', 'Sources actives', 'blue'], [Database, '2,45 Go', 'Données traitées', 'blue'], [Clock3, '00:05:52', 'Durée totale du flux', 'blue'], [CalendarDays, '07:31:56', 'Dernière exécution', 'blue'],
      ].map(([Icon, value, label, tone]) => <button key={label} onClick={() => setSelected(label)}><span className={tone}><Icon /></span><strong>{value}</strong><small>{label}</small></button>)}</div></section>

      <section className="card recent-steps"><h2>Étapes récentes</h2><div>{recent.map(([title, sub, time, ok]) => <button key={title} onClick={() => setSelected(title)}><span className={ok ? 'ok' : 'bad'}>{ok ? <Check /> : <X />}</span><div><b>{title}</b><small className={ok ? '' : 'failed-text'}>{sub}</small></div><time>{time}</time></button>)}</div><button className="history-button" onClick={() => onNavigate('Historique')}>Voir tout l’historique <ArrowRight /></button></section>
    </section>

    <section className="card flux-notice"><span><Info /></span><div><b>Aucune alerte critique</b><small>Le flux ETL fonctionne correctement dans l’ensemble.</small></div><button onClick={() => onNavigate('Alertes')}>Voir les alertes <ArrowRight /></button></section>
    {selected && <div className="flux-toast"><Check /><span><b>{selected}</b><small>Détails de l’étape sélectionnée</small></span><button onClick={() => setSelected(null)}><X /></button></div>}
  </div>;
}
