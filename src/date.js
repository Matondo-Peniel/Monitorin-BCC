export function localDate(value = new Date()) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateValue, days) {
  const [year, month, day] = dateValue.split('-').map(Number);
  return localDate(new Date(year, month - 1, day + days));
}
