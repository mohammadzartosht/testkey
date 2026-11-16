/**
 * تست دسته بازی: دکمه‌ها، تریگرها، استیک‌ها، لرزش و تشخیص دریفت.
 */
import { byId, mustId, el } from '../lib/dom.js';
import { mean } from '../lib/format.js';
import { setVerdict } from '../lib/status.js';

/** برچسب دکمه‌ها در نگاشت استاندارد (Xbox) */
const STANDARD_LABELS = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'Back', 'Start', 'LS', 'RS', '↑', '↓', '←', '→', 'Home'];
const AXIS_NAMES = ['استیک چپ - افقی', 'استیک چپ - عمودی', 'استیک راست - افقی', 'استیک راست - عمودی'];
/** میانگین انحراف از مرکز بیشتر از این مقدار در حالت رها = دریفت */
const DRIFT_THRESHOLD = 0.08;
const DRIFT_SAMPLE_MS = 1500;
const STICK_RADIUS_PERCENT = 40; // درصد شعاع کادر که نقطه می‌تواند جابه‌جا شود

/**
 * تحلیل دریفت از نمونه‌های حالت سکون.
 * @param {number[][]} samples هر نمونه آرایه‌ی ۴ محور
 * @returns {{axis:number, offset:number}[]} محورهای دارای دریفت
 */
export function analyzeDrift(samples, threshold = DRIFT_THRESHOLD) {
  const result = [];
  for (let axis = 0; axis < 4; axis++) {
    const offset = mean(samples.map((s) => s[axis] ?? 0));
    if (offset !== null && Math.abs(offset) > threshold) result.push({ axis, offset });
  }
  return result;
}

export function initGamepad() {
  const grid = mustId('gp-btn-grid');
  const hint = mustId('gp-hint');
  const driftResult = mustId('gp-drift-result');
  const driftBtn = mustId('gp-drift-check');
  const vibrateBtn = mustId('gp-vibrate-btn');

  let cells = [];
  let activeIndex = null;
  let raf = 0;
  let driftSamples = null; // null = در حال نمونه‌گیری نیستیم

  const firstPad = () => Array.from(navigator.getGamepads?.() ?? []).find(Boolean) ?? null;

  function buildButtons(pad) {
    const standard = pad.mapping === 'standard';
    cells = pad.buttons.map((_, i) => el('div', { class: 'gp-btn-cell' }, standard ? (STANDARD_LABELS[i] ?? String(i)) : String(i)));
    grid.replaceChildren(...cells);
  }

  function setStick(id, x, y) {
    const node = byId(id);
    const clamp1 = (v) => Math.max(-1, Math.min(1, v));
    node.style.left = `${50 + clamp1(x) * STICK_RADIUS_PERCENT}%`;
    node.style.top = `${50 + clamp1(y) * STICK_RADIUS_PERCENT}%`;
  }

  function showPad(pad) {
    byId('gp-status').textContent = 'متصل';
    byId('gp-name').textContent = pad.id;
    byId('gp-name').title = pad.id;
    byId('gp-buttons-count').textContent = pad.buttons.length;
    byId('gp-axes-count').textContent = pad.axes.length;
    byId('gp-mapping').textContent = pad.mapping || 'غیراستاندارد';
    hint.hidden = true;
  }

  function showNoPad() {
    byId('gp-status').textContent = 'متصل نیست';
    ['gp-name', 'gp-buttons-count', 'gp-axes-count', 'gp-mapping'].forEach((id) => (byId(id).textContent = '—'));
    grid.replaceChildren();
    cells = [];
    activeIndex = null;
    hint.hidden = false;
    hint.textContent = 'برای فعال‌شدن، دسته را به سیستم وصل کنید و یک دکمه از آن را فشار دهید (این محدودیت خود مرورگرهاست).';
  }

  function poll() {
    const pad = firstPad();
    if (!pad) {
      raf = 0;
      showNoPad();
      return;
    }
    if (activeIndex !== pad.index) {
      activeIndex = pad.index;
      buildButtons(pad);
      showPad(pad);
    }

    pad.buttons.forEach((b, i) => cells[i]?.classList.toggle('pressed', b.pressed || b.value > 0.5));

    const triggerValue = (i) => pad.buttons[i]?.value ?? 0;
    [['lt', 6], ['rt', 7]].forEach(([name, index]) => {
      const v = triggerValue(index);
      byId(`gp-${name}-fill`).style.width = `${(v * 100).toFixed(0)}%`;
      byId(`gp-${name}-val`).textContent = `${(v * 100).toFixed(0)}٪`;
    });

    const [lx = 0, ly = 0, rx = 0, ry = 0] = pad.axes;
    setStick('gp-stick-l', lx, ly);
    setStick('gp-stick-r', rx, ry);
    driftSamples?.push([lx, ly, rx, ry]);

    raf = requestAnimationFrame(poll);
  }

  const startPolling = () => {
    if (!raf) raf = requestAnimationFrame(poll);
  };

  window.addEventListener('gamepadconnected', startPolling);
  window.addEventListener('gamepaddisconnected', () => {
    if (!firstPad()) {
      cancelAnimationFrame(raf);
      raf = 0;
      showNoPad();
      byId('gp-status').textContent = 'قطع شد';
    }
  });
  // اگر دسته از قبل وصل و فعال بوده، بدون انتظار برای رویداد شروع کن
  if (firstPad()) startPolling();

  /* ---------- دریفت ---------- */
  driftBtn.addEventListener('click', () => {
    if (!firstPad()) {
      setVerdict(driftResult, null, 'دسته‌ای متصل نیست.');
      return;
    }
    if (driftSamples) return;
    startPolling();
    driftSamples = [];
    driftBtn.disabled = true;
    setVerdict(driftResult, null, 'در حال بررسی... دسته را رها کنید (۱.۵ ثانیه)');

    setTimeout(() => {
      const samples = driftSamples;
      driftSamples = null;
      driftBtn.disabled = false;
      if (!samples.length) {
        setVerdict(driftResult, null, 'نمونه‌ای دریافت نشد.');
        return;
      }
      const drifting = analyzeDrift(samples);
      if (drifting.length) {
        const list = drifting.map(({ axis, offset }) => `${AXIS_NAMES[axis]} (${(Math.abs(offset) * 100).toFixed(0)}٪)`);
        setVerdict(driftResult, 'fail', `احتمال دریفت در: ${list.join('، ')}`);
      } else {
        setVerdict(driftResult, 'pass', 'دریفتی شناسایی نشد. استیک‌ها در حالت سکون پایدار هستند.');
      }
    }, DRIFT_SAMPLE_MS);
  });

  /* ---------- لرزش ---------- */
  vibrateBtn.addEventListener('click', async () => {
    const pad = firstPad();
    const actuator = pad?.vibrationActuator;
    if (!actuator) {
      hint.hidden = false;
      hint.textContent = pad ? 'دسته یا مرورگر شما از لرزش پشتیبانی نمی‌کند.' : 'دسته‌ای متصل نیست.';
      return;
    }
    try {
      await actuator.playEffect('dual-rumble', { duration: 500, strongMagnitude: 1, weakMagnitude: 1 });
    } catch {
      hint.hidden = false;
      hint.textContent = 'اجرای لرزش ناموفق بود.';
    }
  });

  showNoPad();
}
