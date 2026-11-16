/** توابع عددی خالص (بدون وابستگی به DOM) */

/** عدد را با تعداد ارقام اعشار مشخص قالب می‌دهد؛ مقدار نامعتبر → «—» */
export function fmt(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value) || !Number.isFinite(value)) return '—';
  return value.toFixed(digits);
}

export const mean = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : null);

export function median(list) {
  if (!list.length) return null;
  const sorted = [...list].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** انحراف معیار جامعه */
export function stdDev(list) {
  const m = mean(list);
  if (m === null) return null;
  return Math.sqrt(mean(list.map((v) => (v - m) ** 2)));
}

/** نزدیک‌ترین مقدار از یک فهرست استاندارد، به شرط اینکه در بازه‌ی tolerance (نسبی) باشد */
export function snapTo(value, standards, tolerance = 0.05) {
  let best = value;
  let bestDiff = Infinity;
  for (const s of standards) {
    const diff = Math.abs(value - s) / s;
    if (diff < bestDiff) {
      bestDiff = diff;
      best = s;
    }
  }
  return bestDiff <= tolerance ? best : Math.round(value);
}
