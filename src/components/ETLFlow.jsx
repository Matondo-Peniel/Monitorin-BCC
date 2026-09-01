import { Fragment } from 'react';
import { Check, X, ArrowRight, Database, Landmark } from 'lucide-react';

export default function ETLFlow({ onViewDetails, metrics = {} }) {
  const stages = [
    ['SOURCES', Database, `${metrics.loadedSources||0} / ${metrics.activeSources||0}`, `${metrics.activeSources ? Math.round(metrics.loadedSources * 100 / metrics.activeSources) : 0}%`, (metrics.loadedSources||0)>0],
    ['STAGING', Database, `${metrics.stagingSuccess||0} / ${metrics.total||0}`, `${metrics.stagingRate||0}%`, (metrics.stagingFailed||0)===0&&(metrics.total||0)>0],
    ['DATA WAREHOUSE', Landmark, `${metrics.warehouseSuccess||0} / ${metrics.total||0}`, `${metrics.warehouseRate||0}%`, (metrics.warehouseFailed||0)===0&&(metrics.total||0)>0],
  ];
  return <section className="card panel flow-panel">
    <h2>Flux ETL global</h2>
    <div className="flow-row">
      {stages.map(([name, icon, count, rate, ok], index) => <Fragment key={name}>
        <button className="stage" type="button" onClick={onViewDetails} title={`Consulter le détail du flux ${name}`}>
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
