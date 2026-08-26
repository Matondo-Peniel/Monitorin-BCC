import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Database,
  FileText,
  History,
  Info,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  Settings,
  ShieldCheck,
  UserCog,
  UserRound,
  UserRoundPlus,
  Users,
  X,
} from 'lucide-react';
import bccLogo from '../assets/bcc-logo.png';
import { api } from '../api';

const roleDetails = {
  CONSULTANT: {
    title: 'Consultant',
    Icon: UserRound,
    summary: 'Peut consulter les tableaux de bord, le suivi des chargements, les alertes et les rapports.',
    color: 'consultant',
    permissions: [
      [LayoutDashboard, 'Tableau de bord'],
      [Database, 'Suivi des chargements'],
      [History, 'Historique'],
      [FileText, 'Rapports'],
    ],
  },
  ANALYSTE: {
    title: 'Analyste',
    Icon: UserCog,
    summary: 'Analyse les données, consulte les tableaux de bord et prépare les rapports avancés.',
    color: 'analyst',
    permissions: [
      [LayoutDashboard, 'Tableau de bord et analyses'],
      [Database, 'Suivi des chargements'],
      [History, 'Historique détaillé'],
      [FileText, 'Rapports avancés'],
    ],
  },
  ADMINISTRATEUR: {
    title: 'Administrateur',
    Icon: ShieldCheck,
    summary: 'Gère les utilisateurs et peut traiter les alertes de la plateforme.',
    color: 'administrator',
    permissions: [
      [LayoutDashboard, 'Tableau de bord et suivi'],
      [Users, 'Gestion des utilisateurs'],
      [ShieldCheck, 'Traitement des alertes'],
      [Settings, 'Paramètres de la plateforme'],
    ],
  },
};

const steps = ['Informations générales', 'Attribution du rôle', 'Résumé et confirmation'];

const displayDate = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const displayDateTime = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export default function InviteUserPage({ onCancel, onComplete }) {
  const [form, setForm] = useState({ nomComplet: '', email: '', role: 'CONSULTANT' });
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const selectedRole = roleDetails[form.role];
  const initials = useMemo(() => form.nomComplet.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase() || 'U', [form.nomComplet]);

  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  const selectRole = role => setForm(current => ({ ...current, role }));

  const validateGeneral = event => {
    event.preventDefault();
    const name = form.nomComplet.trim();
    const email = form.email.trim();
    if (!name || !email) {
      setError('Renseignez le nom complet et l’adresse email de l’utilisateur.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Saisissez une adresse email valide.');
      return;
    }
    setError('');
    setStep(2);
  };

  const createInvitation = async () => {
    setSaving(true);
    setError('');
    try {
      const invitation = await api.invite({ ...form, nomComplet: form.nomComplet.trim(), email: form.email.trim() });
      setResult(invitation);
    } catch (exception) {
      setError(exception.message);
    } finally {
      setSaving(false);
    }
  };

  if (result) return <InvitationSuccess result={result} form={form} onComplete={onComplete} />;

  return <main className="invite-page">
    <InviteHeader />
    <Stepper step={step} />
    {step === 1 && <form className="invite-content-grid invite-general-only" onSubmit={validateGeneral} noValidate>
      <section className="invite-surface invite-general-card">
        <SectionTitle icon={UserRound} title="Informations générales" />
        <p className="invite-section-copy">Renseignez les informations essentielles. Le rôle sera choisi à l’étape suivante.</p>
        <div className="invite-form-grid">
          <label className="invite-field invite-field-wide"><span>Nom complet <b>*</b></span><input name="nomComplet" value={form.nomComplet} onChange={update} placeholder="Ex. Mayala Kilonga Nzambi Florin" autoComplete="name" required /></label>
          <label className="invite-field invite-field-wide"><span>Adresse email <b>*</b></span><input name="email" type="email" value={form.email} onChange={update} placeholder="Ex. nom@bcc.cd" autoComplete="email" required /></label>
        </div>
        <div className="invite-security-note"><LockKeyhole /><div><strong>Aucun mot de passe demandé</strong><p>L’utilisateur choisira lui-même son mot de passe sécurisé après réception de l’invitation.</p></div></div>
        {error && <p className="invite-error">{error}</p>}
      </section>
      <WizardActions onCancel={onCancel} onNext={() => {}} nextLabel="Suivant" submit />
    </form>}
    {step === 2 && <section className="invite-content-grid">
      <section className="invite-surface invite-role-selection">
        <SectionTitle icon={ShieldCheck} title="Attribuer un rôle" />
        <p className="invite-section-copy">Choisissez le rôle qui correspond aux responsabilités de cet utilisateur.</p>
        <div className="invite-role-choice-list">{Object.entries(roleDetails).map(([value, role]) => <RoleChoice key={value} role={role} selected={form.role === value} onClick={() => selectRole(value)} />)}</div>
      </section>
      <aside className="invite-surface invite-permissions-card">
        <SectionTitle icon={LockKeyhole} title="Aperçu des accès" />
        <p className="invite-section-copy">Accès inclus pour le rôle sélectionné.</p>
        <RolePreview role={selectedRole} />
        <div className="invite-info-note"><ShieldCheck /><p>Les autorisations sont attribuées par rôle et sont gérées par la plateforme.</p></div>
      </aside>
      <WizardActions onBack={() => setStep(1)} onCancel={onCancel} onNext={() => setStep(3)} />
    </section>}
    {step === 3 && <section className="invite-summary-grid">
      <section className="invite-summary-left">
        <section className="invite-surface invite-summary-card">
          <SectionTitle icon={UserRound} title="Résumé des informations" />
          <div className="invite-person-summary"><span className="invite-initials">{initials}</span><dl><SummaryRow label="Nom complet" value={form.nomComplet} /><SummaryRow label="Adresse email" value={form.email} /><SummaryRow label="Rôle attribué" value={selectedRole.title} /></dl></div>
        </section>
        <section className="invite-surface invite-summary-card">
          <SectionTitle icon={ShieldCheck} title="Accès et permissions" />
          <div className={`invite-role-confirmation ${selectedRole.color}`}><selectedRole.Icon /><div><strong>{selectedRole.title}</strong><p>{selectedRole.summary}</p></div></div>
          <div className="invite-info-note"><Info /><p>Les autorisations sont automatiquement appliquées selon le rôle choisi.</p></div>
        </section>
      </section>
      <aside className="invite-summary-right">
        <section className="invite-surface invite-verification-card">
          <SectionTitle icon={CheckCircle2} title="Vérification finale" />
          <div className="invite-ready"><CheckCircle2 /><div><strong>Les informations sont prêtes</strong><p>Vous pouvez créer l’invitation sécurisée pour cet utilisateur.</p></div></div>
        </section>
        <section className="invite-surface invite-recap-card">
          <SectionTitle icon={FileText} title="Récapitulatif" />
          <dl><SummaryRow label="Nom complet" value={form.nomComplet} /><SummaryRow label="Email" value={form.email} /><SummaryRow label="Rôle" value={selectedRole.title} /></dl>
        </section>
        {error && <p className="invite-error">{error}</p>}
        <WizardActions onBack={() => setStep(2)} onCancel={onCancel} onNext={createInvitation} nextLabel={saving ? 'Création…' : 'Créer l’invitation'} disabled={saving} final />
      </aside>
    </section>}
  </main>;
}

function InviteHeader() {
  return <header className="invite-header">
    <div><h1><UserRoundPlus />Enregistrer un utilisateur</h1><p>Ajoutez un nouveau membre et définissez ses accès à la plateforme.</p></div>
    <div className="invite-header-tools"><span className="invite-date"><CalendarDays />{displayDate.format(new Date())}</span><span className="invite-brand"><img src={bccLogo} alt="Banque Centrale du Congo" /><b>BANQUE CENTRALE<br />DU CONGO</b></span></div>
  </header>;
}

function Stepper({ step }) {
  return <ol className="invite-stepper">{steps.map((label, index) => {
    const number = index + 1;
    return <li key={label} className={number === step ? 'active' : number < step ? 'complete' : ''}><span>{number < step ? <Check /> : number}</span><b>{label}</b></li>;
  })}</ol>;
}

function SectionTitle({ icon: Icon, title }) {
  return <h2 className="invite-section-title"><span><Icon /></span>{title}</h2>;
}

function RoleBrief({ role, selected, onClick }) {
  const { Icon } = role;
  return <button type="button" className={`invite-role-brief-item ${role.color} ${selected ? 'selected' : ''}`} onClick={onClick}><span className="invite-radio" aria-hidden="true" /><span className="invite-role-icon"><Icon /></span><span><b>{role.title}</b><small>{role.summary}</small></span></button>;
}

function RoleChoice({ role, selected, onClick }) {
  const { Icon } = role;
  return <button type="button" className={`invite-role-choice ${role.color} ${selected ? 'selected' : ''}`} onClick={onClick}><span className="invite-radio" aria-hidden="true" /><span className="invite-role-icon"><Icon /></span><span><b>{role.title}</b><small>{role.summary}</small>{selected && <em><Check />Rôle sélectionné</em>}</span></button>;
}

function RolePreview({ role }) {
  const { Icon } = role;
  return <><div className={`invite-selected-role ${role.color}`}><span><Icon /></span><div><small>Rôle sélectionné</small><strong>{role.title}</strong><p>{role.summary}</p></div></div><div className="invite-permission-list">{role.permissions.map(([PermissionIcon, label]) => <div key={label}><PermissionIcon /><span>{label}</span><b><Check />Accès</b></div>)}</div></>;
}

function SummaryRow({ label, value }) {
  return <div><dt>{label}</dt><dd>{value || '—'}</dd></div>;
}

function WizardActions({ onBack, onCancel, onNext, nextLabel = 'Suivant', submit = false, disabled = false, final = false }) {
  return <footer className={`invite-actions ${final ? 'is-final' : ''}`}>{onBack && <button className="invite-button invite-button-secondary" type="button" onClick={onBack}><ArrowLeft />Précédent</button>}<button className="invite-button invite-button-secondary" type="button" onClick={onCancel}><X />Annuler</button><button className="invite-button invite-button-primary" type={submit ? 'submit' : 'button'} onClick={submit ? undefined : onNext} disabled={disabled}>{nextLabel}<ArrowRight /></button></footer>;
}

function InvitationSuccess({ result, form, onComplete }) {
  const expiration = result.expiration ? displayDateTime.format(new Date(result.expiration)) : '—';
  return <main className="invite-page">
    <InviteHeader />
    <Stepper step={3} />
    <section className="invite-success-surface">
      <span className="invite-success-icon"><CheckCircle2 /></span>
      <h2>Invitation créée</h2>
      <p>Le compte de <strong>{result.nomComplet || form.nomComplet}</strong> est enregistré avec le rôle <strong>{roleDetails[form.role].title}</strong>.</p>
      <div className="invite-success-details"><span><Mail /></span><div><b>{result.email || form.email}</b><small>Invitation valable jusqu’au {expiration}.</small></div></div>
      {result.token ? <div className="invite-local-token"><b>Code d’activation local</b><code>{result.token}</code><small>Communiquez-le uniquement au destinataire, puis supprimez-le de vos notes.</small></div> : <div className="invite-info-note"><Mail /><p>Un service de messagerie doit être configuré en production pour transmettre le lien d’activation.</p></div>}
      <footer className="invite-actions is-final"><button className="invite-button invite-button-primary" type="button" onClick={() => onComplete?.({ ...result, name: result.nomComplet, active: false })}>Terminer<ArrowRight /></button></footer>
    </section>
  </main>;
}
