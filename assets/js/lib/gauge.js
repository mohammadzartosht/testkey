/**
 * گیج سرعت‌سنج. به‌جای سه کپی SVG در HTML، هر عنصر [data-gauge] را اینجا می‌سازیم.
 * پیکربندی از data-attributeها: data-min, data-max, data-scale (linear|log),
 * data-low-is-good (برای پینگ)، data-unit، data-end-label.
 */
import { svg, el, clamp } from './dom.js';

const CX = 100;
const CY = 110;
const R = 80;

/** نقطه روی کمان؛ زاویه ۱۸۰ = چپ، ۹۰ = بالا، ۰ = راست */
const point = (deg, radius = R) => {
  const rad = (deg * Math.PI) / 180;
  return [CX + radius * Math.cos(rad), CY - radius * Math.sin(rad)];
};
const fix = (n) => n.toFixed(2);

function arc(fromDeg, toDeg, kind) {
  const [x1, y1] = point(fromDeg);
  const [x2, y2] = point(toDeg);
  return svg('path', { d: `M ${fix(x1)} ${fix(y1)} A ${R} ${R} 0 0 1 ${fix(x2)} ${fix(y2)}`, class: `gauge-arc gauge-arc--${kind}` });
}

/** نسبت ۰..۱ برای یک مقدار روی مقیاس خطی یا لگاریتمی */
export function valueToFraction(value, { min, max, scale }) {
  const v = clamp(value, min, max);
  if (scale === 'log') {
    const lo = Math.log10(Math.max(min, 0.1));
    return clamp((Math.log10(Math.max(v, min)) - lo) / (Math.log10(max) - lo), 0, 1);
  }
  return clamp((v - min) / (max - min), 0, 1);
}

export function createGauge(host) {
  const opts = {
    min: Number(host.dataset.min ?? 0),
    max: Number(host.dataset.max ?? 100),
    scale: host.dataset.scale === 'log' ? 'log' : 'linear',
    lowIsGood: host.dataset.lowIsGood === 'true',
    unit: host.dataset.unit ?? '',
    endLabel: host.dataset.endLabel ?? String(host.dataset.max),
  };
  const colors = opts.lowIsGood ? ['pass', 'warn', 'fail'] : ['fail', 'warn', 'pass'];

  const root = svg('svg', { viewBox: '0 0 200 130', 'aria-hidden': 'true' });
  [180, 135, 90, 45, 0].forEach((deg) => {
    const [x1, y1] = point(deg, R + 8);
    const [x2, y2] = point(deg, R + 17);
    root.append(svg('line', { x1: fix(x1), y1: fix(y1), x2: fix(x2), y2: fix(y2), class: 'gauge-tick' }));
  });
  root.append(arc(180, 120, colors[0]), arc(120, 60, colors[1]), arc(60, 0, colors[2]));

  const needle = svg('polygon', { points: '96,106 104,106 100,32', class: 'gauge-needle' });
  root.append(needle, svg('circle', { cx: CX, cy: CY, r: 8, class: 'gauge-hub' }), svg('circle', { cx: CX, cy: CY, r: 3.2, class: 'gauge-hub-dot' }));

  const digital = el('div', { class: 'gauge-digital', 'aria-live': 'off' });
  const render = (text) => digital.replaceChildren(text, el('span', { class: 'unit' }, opts.unit));
  render('—');

  host.replaceChildren(root, el('div', { class: 'gauge-scale' }, el('span', {}, String(opts.min)), el('span', {}, opts.endLabel)), digital);

  return {
    /** سوزن و عدد دیجیتال را به‌روز می‌کند */
    set(value, digits = 1) {
      if (value === null || !Number.isFinite(value)) {
        needle.style.transform = 'rotate(-90deg)';
        render('—');
        return;
      }
      const angle = (valueToFraction(value, opts) - 0.5) * 180;
      needle.style.transform = `rotate(${angle.toFixed(1)}deg)`;
      render(value === null ? '—' : value.toFixed(digits));
    },
    /** فقط سوزن (بدون تغییر عدد) */
    needle(value) {
      needle.style.transform = `rotate(${((valueToFraction(value, opts) - 0.5) * 180).toFixed(1)}deg)`;
    },
    text: render,
    reset() {
      needle.style.transform = 'rotate(-90deg)';
      render('—');
    },
  };
}

/** همه‌ی گیج‌های صفحه را می‌سازد و بر اساس data-gauge در یک شیء برمی‌گرداند */
export function initGauges() {
  const gauges = {};
  document.querySelectorAll('[data-gauge]').forEach((host) => {
    gauges[host.dataset.gauge] = createGauge(host);
  });
  return gauges;
}
