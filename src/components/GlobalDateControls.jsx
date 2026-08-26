import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, RefreshCw } from 'lucide-react';
import { localDate } from '../date';
import { useActiveDate } from '../active-date';

const formatDate = value => new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date(`${value}T12:00:00`));

export default function GlobalDateControls({ onRefresh, refreshing = false, className = '' }) {
  const { activeDate, setActiveDate } = useActiveDate();
  const [selectedDate, setSelectedDate] = useState(activeDate);
  const [open, setOpen] = useState(false);
  const [refreshVisible, setRefreshVisible] = useState(false);
  const controlRef = useRef(null);
  const today = localDate();

  useEffect(() => { setSelectedDate(activeDate); }, [activeDate]);
  useEffect(() => {
    const close = event => {
      if (controlRef.current && !controlRef.current.contains(event.target)) setOpen(false);
    };
    const escape = event => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', escape);
    };
  }, []);

  const apply = () => {
    if (!selectedDate || selectedDate === activeDate) return;
    setActiveDate(selectedDate);
    setOpen(false);
  };
  const chooseToday = () => {
    setSelectedDate(today);
    setActiveDate(today);
    setOpen(false);
  };
  const runRefresh = async () => {
    if (!onRefresh || refreshing || refreshVisible) return;
    setRefreshVisible(true);
    try {
      await Promise.allSettled([
        Promise.resolve().then(() => onRefresh()),
        new Promise(resolve => window.setTimeout(resolve, 1000)),
      ]);
    } finally {
      setRefreshVisible(false);
    }
  };
  const refreshBusy = refreshing || refreshVisible;

  return <div className={`global-date-controls ${className}`.trim()}>
    <div className="date-control" ref={controlRef}>
      <button type="button" className="date-box" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(value => !value)}>
        <CalendarDays /><span>{formatDate(activeDate)}</span><ChevronDown />
      </button>
      {open && <div className="date-popover" role="dialog" aria-label="Choisir la date active">
        <b>Date de consultation</b>
        <input type="date" value={selectedDate} max={today} onChange={event => setSelectedDate(event.target.value)} />
        <div className="global-date-popover-actions">
          <button type="button" onClick={chooseToday}>Aujourd’hui</button>
          <button type="button" className="is-primary" disabled={!selectedDate || selectedDate === activeDate} onClick={apply}>Appliquer</button>
        </div>
      </div>}
    </div>
    {onRefresh && <button type="button" className="refresh" disabled={refreshBusy} aria-busy={refreshBusy} onClick={runRefresh}>
      <RefreshCw className={refreshBusy ? 'spin' : ''} />{refreshBusy ? 'Actualisation…' : 'Actualiser'}
    </button>}
  </div>;
}
