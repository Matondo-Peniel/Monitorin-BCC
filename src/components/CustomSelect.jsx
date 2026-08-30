import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export default function CustomSelect({ label, value, onChange, options, icon: Icon, ariaLabel, className = '', placeholder = '' }) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(Math.max(0, options.findIndex(option => option.value === value)));
  const rootRef = useRef(null);
  const optionRefs = useRef([]);
  const listId = useId();
  const selected = options.find(option => option.value === value);

  useEffect(() => {
    const close = event => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const escape = event => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', escape);
    };
  }, []);

  useEffect(() => {
    if (open) optionRefs.current[focusedIndex]?.focus();
  }, [focusedIndex, open]);

  const select = nextValue => {
    onChange(nextValue);
    setFocusedIndex(Math.max(0, options.findIndex(option => option.value === nextValue)));
    setOpen(false);
  };
  const onTriggerKeyDown = event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const index = Math.max(0, options.findIndex(option => option.value === value));
      setFocusedIndex(event.key === 'ArrowDown' ? Math.min(options.length - 1, index + 1) : Math.max(0, index - 1));
      setOpen(true);
    }
  };
  const onOptionKeyDown = (event, index) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setFocusedIndex(event.key === 'ArrowDown' ? Math.min(options.length - 1, index + 1) : Math.max(0, index - 1));
    }
    if (event.key === 'Escape') setOpen(false);
  };

  return <div className={`custom-select ${className}`.trim()} ref={rootRef}>
    {label && <span className="custom-select-label">{label}</span>}
    <button type="button" className="custom-select-trigger" aria-label={ariaLabel || label} aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} onClick={() => setOpen(value => !value)} onKeyDown={onTriggerKeyDown}>
      {Icon && <Icon />}<span>{selected?.label || placeholder || options[0]?.label}</span><ChevronDown className={open ? 'is-open' : ''} />
    </button>
    {open && <div id={listId} className="custom-select-menu" role="listbox" aria-label={ariaLabel || label}>
      {options.map((option, index) => {
        const OptionIcon = option.icon;
        const isSelected = option.value === value;
        return <button key={option.value} ref={element => { optionRefs.current[index] = element; }} type="button" role="option" aria-selected={isSelected} className={`custom-select-option ${isSelected ? 'is-selected' : ''}`} onClick={() => select(option.value)} onKeyDown={event => onOptionKeyDown(event, index)}>
          {OptionIcon && <OptionIcon className={option.tone || ''} />}<span>{option.label}</span>{isSelected && <Check />}
        </button>;
      })}
    </div>}
  </div>;
}
