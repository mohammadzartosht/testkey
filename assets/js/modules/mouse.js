/**
 * تست ماوس: دکمه‌های اصلی و کناری، دبل‌کلیک/لرزش کلیک (chatter) و چرخ اسکرول.
 */
import { byId, mustId, isOverlayOpen } from '../lib/dom.js';
import { setStatus, getKind } from '../lib/status.js';
import { report } from '../lib/report.js';

/** فاصله‌ی زیر این مقدار بین دو کلیک پیاپی، برای انسان غیرممکن است ← لرزش کلیک */
const CHATTER_MS = 50;
/** تعداد کلیک لازم برای قضاوت درباره‌ی دبل‌کلیک */
const MIN_DBL_CLICKS = 6;
/** تغییر جهت اسکرول در کمتر از این مدت (میلی‌ثانیه) یعنی نوسان غیرعادی چرخ */
const SCROLL_JITTER_MS = 25;
const MIN_SCROLL_TICKS = 8;

/** دکمه‌های ماوس بر اساس event.button */
const BUTTONS = {
  0: { key: 'left', svg: 'svg-left', chip: 'chip-left', label: 'کلیک چپ' },
  1: { key: 'middle', svg: 'svg-middle', chip: 'chip-middle', label: 'کلیک وسط' },
  2: { key: 'right', svg: 'svg-right', chip: 'chip-right', label: 'کلیک راست' },
  3: { key: 'back', svg: 'svg-back', chip: 'chip-back', label: 'دکمه کناری ۱' },
  4: { key: 'forward', svg: 'svg-forward', chip: 'chip-forward', label: 'دکمه کناری ۲' },
};

/** روی این عناصر رفتار عادی مرورگر (منوی راست‌کلیک، لینک، انتخاب متن) حفظ می‌شود و شمرده نمی‌شوند. */
const NATIVE_ZONE = 'input, textarea, select, a, summary, label';

const newState = () => ({
  counts: { left: 0, middle: 0, right: 0, back: 0, forward: 0 },
  clickTimes: [],
  dblCount: 0,
  chatter: 0,
  minGap: null,
  scrollUp: 0,
  scrollDown: 0,
  scrollJitter: 0,
  lastWheel: null,
});

export function initMouse() {
  let state = newState();

  const statusButtons = mustId('status-buttons');
  const statusDbl = mustId('status-dbl');
  const statusScroll = mustId('status-scroll');

  /* ---------- دکمه‌ها ---------- */
  const setLit = (button, on) => {
    const def = BUTTONS[button];
    if (!def) return;
    byId(def.svg).classList.toggle('active', on);
    byId(def.chip).classList.toggle('active', on);
  };

  const inNativeZone = (target) => target instanceof Element && target.closest(NATIVE_ZONE) !== null;

  document.addEventListener('mousedown', (e) => {
    if (isOverlayOpen() || inNativeZone(e.target) || !BUTTONS[e.button]) return;
    if (e.button !== 0) e.preventDefault(); // جلوگیری از autoscroll وسط و ناوبری دکمه‌های کناری
    state.counts[BUTTONS[e.button].key]++;
    setLit(e.button, true);
    renderButtons();
  });
  document.addEventListener('mouseup', (e) => {
    if (BUTTONS[e.button] && e.button > 2 && !inNativeZone(e.target)) e.preventDefault();
    setLit(e.button, false);
  });
  document.addEventListener('auxclick', (e) => {
    if (!inNativeZone(e.target)) e.preventDefault();
  });
  document.addEventListener('contextmenu', (e) => {
    if (!inNativeZone(e.target)) e.preventDefault();
  });
  // اگر پنجره فوکوس را از دست داد، دکمه‌ی «گیرکرده» روشن نماند
  window.addEventListener('blur', () => Object.keys(BUTTONS).forEach((b) => setLit(Number(b), false)));

  function renderButtons() {
    const { left, right, middle, back, forward } = state.counts;
    byId('cnt-left').textContent = left;
    byId('cnt-right').textContent = right;
    byId('cnt-middle').textContent = middle;
    byId('cnt-side').textContent = `${back} / ${forward}`;

    const all = left > 0 && right > 0 && middle > 0;
    setStatus(statusButtons, all ? 'pass' : 'pending', all ? 'هر سه دکمه تأیید شد' : 'در انتظار تست همه دکمه‌ها');

    [0, 2, 1].forEach((b) => {
      const { key, label } = BUTTONS[b];
      report.set(`btn-${key}`, label, state.counts[key] > 0 ? 'pass' : 'pending');
    });
  }

  /* ---------- دبل‌کلیک و لرزش کلیک ---------- */
  const target = mustId('dbl-target');

  target.addEventListener('click', (e) => {
    // timeStamp زمان واقعی رویداد است، نه زمانی که کد ما اجرا شد
    const now = e.timeStamp;
    const last = state.clickTimes[state.clickTimes.length - 1];
    if (last !== undefined) {
      const gap = now - last;
      if (state.minGap === null || gap < state.minGap) state.minGap = gap;
      if (gap < CHATTER_MS) state.chatter++;
    }
    state.clickTimes.push(now);
    renderDouble();
  });
  target.addEventListener('dblclick', () => {
    state.dblCount++;
    renderDouble();
  });

  function renderDouble() {
    const clicks = state.clickTimes.length;
    byId('dbl-clicks').textContent = clicks;
    byId('dbl-count').textContent = state.dblCount;
    byId('dbl-gap').textContent = state.minGap === null ? '—' : `${Math.round(state.minGap)} ms`;

    if (state.chatter > 0) setStatus(statusDbl, 'fail', 'احتمال لرزش کلیک شناسایی شد');
    else if (clicks >= MIN_DBL_CLICKS && state.dblCount > 0) setStatus(statusDbl, 'pass', 'دبل‌کلیک به‌درستی کار می‌کند');
    else if (clicks >= MIN_DBL_CLICKS) setStatus(statusDbl, 'warn', 'دبل‌کلیک ثبت نشد، دوباره امتحان کنید');
    else setStatus(statusDbl, 'pending', 'در حال آزمایش');

    report.set('dbl', 'دبل‌کلیک', getKind(statusDbl));
    report.set('chatter', 'پایداری کلیک', state.chatter > 0 ? 'fail' : clicks >= MIN_DBL_CLICKS ? 'pass' : 'pending');
  }

  /* ---------- چرخ اسکرول ---------- */
  const zone = mustId('scroll-zone');
  const dot = mustId('scroll-dot');
  const arrows = { up: mustId('arrow-up'), down: mustId('arrow-down') };
  const lockNote = mustId('lock-note');
  const lockText = mustId('lock-note-text');
  const flashTimers = new WeakMap();

  const setHover = (on) => {
    zone.classList.toggle('is-locked', on);
    lockNote.classList.toggle('on', on);
    lockText.textContent = on ? 'اسکرول صفحه قفل شد — فقط تست اسکرول فعال است' : 'اسکرول صفحه فعال است';
  };
  zone.addEventListener('pointerenter', () => setHover(true));
  zone.addEventListener('pointerleave', () => setHover(false));

  function flash(node) {
    node.classList.add('flash');
    clearTimeout(flashTimers.get(node));
    flashTimers.set(node, setTimeout(() => node.classList.remove('flash'), 180));
  }

  // wheel باید non-passive باشد تا preventDefault جلوی اسکرول صفحه را بگیرد
  zone.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      if (e.deltaY === 0) return; // اسکرول افقی/لمسی خالص
      const dir = e.deltaY > 0 ? 'down' : 'up';

      if (state.lastWheel && dir !== state.lastWheel.dir && e.timeStamp - state.lastWheel.t < SCROLL_JITTER_MS) {
        state.scrollJitter++;
      }
      state.lastWheel = { t: e.timeStamp, dir };

      if (dir === 'down') {
        state.scrollDown++;
        dot.style.top = '80%';
        flash(arrows.down);
      } else {
        state.scrollUp++;
        dot.style.top = '20%';
        flash(arrows.up);
      }
      renderScroll();
    },
    { passive: false },
  );

  function renderScroll() {
    byId('cnt-up').textContent = state.scrollUp;
    byId('cnt-down').textContent = state.scrollDown;
    const total = state.scrollUp + state.scrollDown;

    if (state.scrollJitter >= 3) setStatus(statusScroll, 'warn', 'نوسان غیرعادی در چرخ اسکرول');
    else if (total >= MIN_SCROLL_TICKS) setStatus(statusScroll, 'pass', 'چرخ اسکرول تأیید شد');
    else setStatus(statusScroll, 'pending', 'در حال آزمایش');

    report.set('scroll', 'چرخ اسکرول', getKind(statusScroll));
  }

  /* ---------- ریست ---------- */
  document.addEventListener('tester:reset', () => {
    state = newState();
    Object.keys(BUTTONS).forEach((b) => setLit(Number(b), false));
    dot.style.top = '50%';
    renderButtons();
    renderDouble();
    renderScroll();
  });

  renderButtons();
  renderDouble();
  renderScroll();
}
