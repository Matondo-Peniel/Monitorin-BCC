import { ChevronLeft, ChevronRight } from 'lucide-react';

const pageNumbers = (current, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1);
  const start = Math.max(1, Math.min(current - 2, total - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
};

export default function Pagination({ currentPage, totalPages, totalItems, pageSize, onPageChange, itemLabel = 'élément', itemLabelPlural, disabled = false }) {
  const pages = Math.max(1, totalPages || Math.ceil(totalItems / pageSize) || 1);
  const page = Math.max(1, Math.min(currentPage || 1, pages));
  const first = totalItems ? (page - 1) * pageSize + 1 : 0;
  const last = totalItems ? Math.min(page * pageSize, totalItems) : 0;
  const label = totalItems === 1 ? itemLabel : (itemLabelPlural || `${itemLabel}s`);
  const go = next => { if (!disabled && next >= 1 && next <= pages && next !== page) onPageChange(next); };

  return <footer className="common-pagination" aria-label={`Pagination des ${label}`}>
    <span>Affichage {first} à {last} sur {totalItems} {label}</span>
    <nav aria-label="Pages">
      <button type="button" aria-label="Page précédente" disabled={disabled || page <= 1} onClick={() => go(page - 1)}><ChevronLeft /></button>
      {pageNumbers(page, pages).map(number => <button type="button" key={number} className={number === page ? 'is-current' : ''} aria-current={number === page ? 'page' : undefined} disabled={disabled} onClick={() => go(number)}>{number}</button>)}
      <button type="button" aria-label="Page suivante" disabled={disabled || page >= pages} onClick={() => go(page + 1)}><ChevronRight /></button>
    </nav>
  </footer>;
}
