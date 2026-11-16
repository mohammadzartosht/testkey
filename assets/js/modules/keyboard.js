/**
 * تست صفحه‌کلید: رسم چیدمان، ثبت کلیدها با KeyboardEvent.code، شمارش هم‌زمانی (rollover).
 */
import { byId, mustId, $$, el, isEditable, isOverlayOpen } from '../lib/dom.js';
import { setStatus } from '../lib/status.js';
import { report } from '../lib/report.js';
import { LAYOUTS, codesOf } from './keyboard-layouts.js';

const KEY_UNIT = 40; // پیکسل برای یک واحد
const KEY_GAP = 4;
const MODIFIER_CODES = new Set(['ControlLeft', 'ControlRight', 'MetaLeft', 'MetaRight', 'AltLeft', 'AltRight', 'ShiftLeft', 'ShiftRight']);

export function initKeyboard() {
  const board = mustId('kb-board');
  const viewport = mustId('kb-viewport');
  const status = mustId('status-kb');

  const codes = Object.fromEntries(Object.keys(LAYOUTS).map((id) => [id, codesOf(id)]));
  const tested = Object.fromEntries(Object.keys(LAYOUTS).map((id) => [id, new Set()]));
  const active = new Set();
  let maxConcurrent = 0;
  let current = 'full';
  /** code → عنصر کلید، فقط برای چیدمان فعلی */
  let nodes = new Map();

  /* ---------- رسم ---------- */
  function keyWidth(u) {
    return Math.round(u * KEY_UNIT + (u - 1) * KEY_GAP);
  }

  function draw() {
    nodes = new Map();
    const clusters = LAYOUTS[current].clusters.map((rows) =>
      el(
        'div',
        { class: 'kb-cluster' },
        rows.map((row) =>
          el(
            'div',
            { class: 'kb-row' },
            row.map((k) => {
              const node = el('div', { class: k.spacer ? 'key spacer' : 'key' }, k.spacer ? '' : k.label);
              node.style.width = `${keyWidth(k.u)}px`;
              if (!k.spacer) {
                nodes.set(k.code, node);
                node.classList.toggle('tested', tested[current].has(k.code));
                node.classList.toggle('active', active.has(k.code));
              }
              return node;
            }),
          ),
        ),
      ),
    );
    board.replaceChildren(el('div', { class: 'kb-clusters' }, ...clusters));
    fit();
    renderStats();
  }

  /** اگر صفحه‌کلید از عرض کادر بزرگ‌تر بود، کوچک می‌شود (به‌جای اسکرول افقی) */
  function fit() {
    board.style.transform = 'none';
    const natural = board.offsetWidth;
    const scale = Math.min(1, viewport.clientWidth / natural);
    board.style.transform = scale < 1 ? `scale(${scale})` : 'none';
    viewport.style.height = `${Math.ceil(board.offsetHeight * scale)}px`;
  }
  // فقط تغییر عرض مهم است؛ تغییر ارتفاعِ خودِ fit() نباید دوباره آن را فراخوانی کند
  let lastWidth = 0;
  new ResizeObserver(() => {
    if (viewport.clientWidth === lastWidth) return;
    lastWidth = viewport.clientWidth;
    fit();
  }).observe(viewport);

  /* ---------- آمار و گزارش ---------- */
  function renderStats() {
    const total = codes[current].size;
    const done = tested[current].size;
    byId('kb-total').textContent = total;
    byId('kb-tested').textContent = done;
    byId('kb-remaining').textContent = total - done;
    byId('kb-concurrent').textContent = active.size;
    byId('kb-max').textContent = maxConcurrent;

    let kind = 'pending';
    if (done >= total) {
      kind = 'pass';
      setStatus(status, 'pass', 'همه کلیدها تست شدند');
    } else if (done > 0) {
      kind = 'warn';
      setStatus(status, 'warn', 'تست کیبورد در حال انجام است');
    } else {
      setStatus(status, 'pending', 'در انتظار تست');
    }
    report.set('keyboard', `کیبورد (${LAYOUTS[current].label})`, kind);
  }

  /* ---------- ثبت کلیدها ---------- */
  function press(code) {
    active.add(code);
    tested[current].add(code);
    maxConcurrent = Math.max(maxConcurrent, active.size);
    const node = nodes.get(code);
    if (node) node.classList.add('active', 'tested');
    renderStats();
  }

  function release(code) {
    active.delete(code);
    nodes.get(code)?.classList.remove('active');
    renderStats();
  }

  const relevant = (e) => !isOverlayOpen() && !isEditable(e.target) && codes[current].has(e.code);

  document.addEventListener('keydown', (e) => {
    if (!relevant(e)) return;
    // کلیدهای ترکیبی مرورگر (Ctrl+R، Ctrl+W و…) را مسدود نمی‌کنیم؛ بقیه‌ی کلیدها (F5، Tab، F11…) برای تست مسدود می‌شوند
    const browserShortcut = (e.ctrlKey || e.metaKey) && !MODIFIER_CODES.has(e.code);
    if (!browserShortcut) e.preventDefault();
    if (!e.repeat) press(e.code);
  });

  document.addEventListener('keyup', (e) => {
    if (!relevant(e)) return;
    // PrintScreen (در ویندوز) و برخی کلیدهای دیگر فقط keyup می‌فرستند
    if (!active.has(e.code)) {
      press(e.code);
      setTimeout(() => release(e.code), 120);
      return;
    }
    release(e.code);
  });

  // وقتی پنجره فوکوس را از دست می‌دهد keyup نمی‌رسد؛ کلیدهای «گیرکرده» را پاک کن
  window.addEventListener('blur', () => {
    $$('.key.active', board).forEach((n) => n.classList.remove('active'));
    active.clear();
    renderStats();
  });

  /* ---------- تغییر اندازه و ریست ---------- */
  const tabs = $$('.kb-tabs [data-layout]');
  tabs.forEach((btn) =>
    btn.addEventListener('click', () => {
      current = btn.dataset.layout;
      active.clear();
      tabs.forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      draw();
    }),
  );

  document.addEventListener('tester:reset', () => {
    Object.values(tested).forEach((set) => set.clear());
    active.clear();
    maxConcurrent = 0;
    draw();
  });

  draw();
}
