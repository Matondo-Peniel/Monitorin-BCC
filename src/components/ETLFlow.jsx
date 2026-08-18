import { Fragment } from 'react';
import { Check, X, ArrowRight, Database, Landmark } from 'lucide-react';

const stages = [
  ['SOURCES', Database, '10 / 12', '83%', true],
  ['STAGING', Database, '9 / 10', '90%', true],
  ['DATA WAREHOUSE', Landmark, '8 / 10', '80%', false],
];

export default function ETLFlow({ onViewDetails }) {
  return <section className="card panel flow-panel">
    <h2>Flux ETL global</h2>
    <div className="flow-row">
      {stages.map(([name, icon, count, rate, ok], index) => <Fragment key={name}>
        <button className="stage" onClick={() => alert(`${name} : ${count} (${rate})`)}>
          <span className="stage-card">
            <b>{name}</b>
            <span className={`stage-icon ${typeof icon === 'string' ? 'image' : 'vector'}`}>
              {typeof icon === 'string' ? <img src={icon} alt="" /> : (() => { const Icon = icon; return <Icon />; })()}
            </span>
          </span>
          <span className={`stage-state ${ok ? 'ok' : 'bad'}`} aria-label={ok ? 'Opération réussie' : 'Opération échouée'}>
            {ok ? <Check /> : <X />}
          </span>
          <strong>{count}<small>({rate})</small></strong>
        </button>
        {index < stages.length - 1 && <ArrowRight className="flow-arrow" />}
      </Fragment>)}
    </div>
    <button className="text-link" onClick={onViewDetails}>
      Voir le flux détaillé <ArrowRight />
    </button>
  </section>;
}
