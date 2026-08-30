import { Activity, ArrowRight, BarChart3, Database, LayoutDashboard, ShieldAlert } from 'lucide-react';
import BccBrand from './BccBrand';

const dashboards = [
  {
    title: 'Vue d’ensemble ETL',
    description: 'Les indicateurs essentiels, les taux de réussite et l’évolution des chargements.',
    icon: LayoutDashboard,
    tone: 'blue',
    target: 'Tableau de bord',
    tag: 'Pilotage global',
  },
  {
    title: 'Suivi des chargements',
    description: 'Les exécutions de la date active, leurs étapes et leur statut détaillé.',
    icon: Database,
    tone: 'green',
    target: 'Suivi des chargements',
    tag: 'Opérations ETL',
  },
  {
    title: 'Analyse du flux ETL',
    description: 'Le parcours Sources, Staging et Entrepôt avec les taux de réussite par étape.',
    icon: Activity,
    tone: 'cyan',
    target: 'Flux ETL',
    tag: 'Flux de données',
  },
  {
    title: 'Alertes et incidents',
    description: 'Les anomalies à traiter et leur niveau de priorité pour sécuriser le monitoring.',
    icon: ShieldAlert,
    tone: 'amber',
    target: 'Alertes',
    tag: 'Supervision',
  },
  {
    title: 'Historique & tendances',
    description: 'La consultation des chargements passés et des tendances de performance.',
    icon: BarChart3,
    tone: 'violet',
    target: 'Historique',
    tag: 'Analyse',
  },
];

export default function DashboardsPage({ onNavigate }) {
  return <div className="dashboards-page">
    <header className="dashboards-header">
      <div><span className="dashboards-eyebrow"><LayoutDashboard /> Espaces de pilotage</span><h1>Tableaux de bord</h1><p>Choisissez la vue qui correspond à votre besoin de supervision.</p></div>
      <BccBrand className="dashboards-brand" compact />
    </header>
    <section className="dashboards-catalog" aria-label="Tableaux de bord disponibles">
      {dashboards.map(({ title, description, icon: Icon, tone, target, tag }) => <button type="button" className={`dashboard-choice dashboard-choice--${tone}`} key={target} onClick={() => onNavigate(target)}>
        <span className="dashboard-choice-icon"><Icon /></span><span className="dashboard-choice-content"><small>{tag}</small><strong>{title}</strong><em>{description}</em></span><span className="dashboard-choice-arrow"><ArrowRight /></span>
      </button>)}
    </section>
  </div>;
}
