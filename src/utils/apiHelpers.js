// Small helpers shared by every screen that talks to the backend.

/** Normalise any list style response ([], {results:[]}, {data:[]}) into an array */
export const toList = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.results)) return res.results;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.results)) return res.data.results;
  return [];
};

/** Format a number as money: 1234.5 → 1,234.50 */
export const money = (v) =>
  Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** YYYY-MM-DD for today (local time) */
export const today = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

/** "2026-09-12T10:00:00Z" → "12 Sep 2026" */
export const fmtDate = (v) => {
  if (!v) return '-';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v).split('T')[0];
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Pull a display name out of a relation that may be an id, a string or a nested object */
export const nameOf = (v, fallback = '-') => {
  if (!v) return fallback;
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  return v.name || v.full_name || v.username || v.title || fallback;
};

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const YEARS = (() => {
  const y = new Date().getFullYear();
  return [y - 2, y - 1, y, y + 1];
})();
