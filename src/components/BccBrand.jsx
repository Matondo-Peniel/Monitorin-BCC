import bccLogo from '../assets/bcc-logo.png';

export default function BccBrand({ className = '', compact = false }) {
  return <div className={`bcc-brand ${compact ? 'is-compact' : ''} ${className}`.trim()}><img src={bccLogo} alt="Banque Centrale du Congo" /><b>BANQUE CENTRALE<br />DU CONGO</b></div>;
}
