/**
 * گزارش تشخیصی (ماوس + کیبورد).
 * هر ماژول با report.set(id, label, kind) وضعیت خودش را اعلام می‌کند و این فایل
 * فهرست، حلقه‌ی پیشرفت، جمع‌بندی و متن قابل‌کپی را از روی همان‌ها می‌سازد.
 */
import { byId, el, toast } from './dom.js';
import { kindLabel } from './status.js';

const rows = new Map(); // id → { label, kind }
const RING_LENGTH = 2 * Math.PI * 40;

export const report = {
  /** ثبت یا به‌روزرسانی یک ردیف. ترتیب نمایش = ترتیب اولین ثبت. */
  set(id, label, kind) {
    const prev = rows.get(id);
    if (prev && prev.label === label && prev.kind === kind) return;
    rows.set(id, { label, kind });
    schedule();
  },

  /** متن گزارش برای کپی */
  toText() {
    const lines = [...rows.values()].map((r) => `${r.label}: ${kindLabel(r.kind)}`);
    return `گزارش تست ماوس و کیبورد — فروشگاه توس آراکس\n${lines.join('\n')}`;
  },

  /** همه‌ی ماژول‌ها را برای ریست خبر می‌کند */
  reset() {
    document.dispatchEvent(new CustomEvent('tester:reset'));
  },
};

let scheduled = false;
/** چند به‌روزرسانی پشت‌سرهم در یک فریم یک‌جا رسم می‌شوند. */
function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    render();
  });
}

function summarize(list) {
  if (list.some((r) => r.kind === 'fail')) return 'یک یا چند مشکل احتمالی شناسایی شد. موارد قرمز را بررسی کنید.';
  if (list.length && list.every((r) => r.kind === 'pass')) return 'همه آزمایش‌ها با موفقیت انجام شد. ماوس و کیبورد سالم به نظر می‌رسند.';
  if (list.some((r) => r.kind === 'warn')) return 'برخی موارد در حال تست هستند یا نیاز به بررسی بیشتر دارند.';
  return 'آزمایش در حال انجام است، همه بخش‌ها را امتحان کنید.';
}

function render() {
  const container = byId('report-rows');
  if (!container) return;
  const list = [...rows.values()];

  container.replaceChildren(
    ...list.map((r) =>
      el(
        'div',
        { class: 'report-row' },
        el('span', { class: 'left' }, el('span', { class: 'dot', dataset: { kind: r.kind } }), r.label),
        el('span', { class: 'status-text' }, kindLabel(r.kind)),
      ),
    ),
  );

  byId('verdict').textContent = summarize(list);

  const passed = list.filter((r) => r.kind === 'pass').length;
  byId('report-ring-fg').style.strokeDashoffset = String(RING_LENGTH * (1 - (list.length ? passed / list.length : 0)));
  byId('report-ring-num').textContent = `${passed}/${list.length}`;
}

export function initReport() {
  byId('btn-reset').addEventListener('click', () => report.reset());
  byId('btn-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(report.toText());
      toast('گزارش کپی شد');
    } catch {
      toast('کپی انجام نشد؛ مرورگر اجازه‌ی دسترسی به کلیپ‌بورد را نداد.', 2800);
    }
  });
  render();
}
