/**
 * تست مانیتور: اطلاعات نمایشگر + پنج تست تصویری تمام‌صفحه.
 */
import { byId, mustId, $$, el } from '../lib/dom.js';
import { median, snapTo } from '../lib/format.js';

const REFRESH_RATES = [24, 30, 48, 50, 60, 72, 75, 90, 100, 120, 144, 165, 180, 240, 360];

/* ==========================================================================
   اطلاعات نمایشگر
   ========================================================================== */
function matches(query) {
  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

/** نرخ تازه‌سازی را از میانه‌ی فاصله‌ی فریم‌ها تخمین می‌زند (میانه در برابر پرش‌های گاه‌به‌گاه مقاوم است). */
function measureRefreshRate(frames = 90) {
  return new Promise((resolve) => {
    const deltas = [];
    let last = null;
    const step = (ts) => {
      if (last !== null) deltas.push(ts - last);
      last = ts;
      if (deltas.length < frames) requestAnimationFrame(step);
      else resolve(snapTo(1000 / median(deltas.slice(10)), REFRESH_RATES));
    };
    requestAnimationFrame(step);
  });
}

function initInfo() {
  const dpr = window.devicePixelRatio || 1;
  byId('mon-resolution').textContent = `${screen.width}×${screen.height}`;
  byId('mon-physical').textContent = `${Math.round(screen.width * dpr)}×${Math.round(screen.height * dpr)}`;
  byId('mon-dpr').textContent = `${dpr.toFixed(2)}x`;
  byId('mon-gamut').textContent = matches('(color-gamut: rec2020)') ? 'Rec.2020' : matches('(color-gamut: p3)') ? 'Display P3' : 'sRGB';
  byId('mon-hdr').textContent = matches('(dynamic-range: high)') ? 'دارد' : 'ندارد';

  const refresh = byId('mon-refresh');
  refresh.textContent = '…';
  measureRefreshRate().then((hz) => {
    refresh.textContent = `~${hz} Hz`;
  });
}

/* ==========================================================================
   تست‌های تمام‌صفحه
   هر تست: steps (تعداد مرحله)، render(i, surface)، hud(i)
   ========================================================================== */
const stripes = (...gradients) => el('div', { class: 'mt-fill mt-fill--col' }, gradients.map((g) => {
  const row = el('div');
  row.style.background = g;
  return row;
}));

const TESTS = {
  deadpixel: (() => {
    const colors = [
      ['#000000', 'مشکی'], ['#ffffff', 'سفید'], ['#ff0000', 'قرمز'], ['#00ff00', 'سبز'], ['#0000ff', 'آبی'],
      ['#00ffff', 'فیروزه‌ای'], ['#ff00ff', 'بنفش'], ['#ffff00', 'زرد'], ['#808080', 'خاکستری متوسط'],
    ];
    return {
      steps: colors.length,
      render: (i, surface) => {
        surface.replaceChildren();
        surface.style.background = colors[i][0];
      },
      hud: (i) => `رنگ: ${colors[i][1]} — کلیک یا فاصله برای رنگ بعدی (${i + 1}/${colors.length})`,
    };
  })(),

  gradient: {
    steps: 2,
    render: (i, surface) => {
      surface.style.background = '#000';
      surface.replaceChildren(
        i === 0
          ? stripes('linear-gradient(90deg,#000,#f00)', 'linear-gradient(90deg,#000,#0f0)', 'linear-gradient(90deg,#000,#00f)')
          : stripes('linear-gradient(90deg,#000,#fff)'),
      );
    },
    hud: (i) => (i === 0 ? 'گرادیان قرمز / سبز / آبی — کلیک برای گرادیان خاکستری' : 'گرادیان خاکستری برای بررسی بندینگ — کلیک برای بازگشت'),
  },

  contrast: {
    steps: 2,
    render: (i, surface) => {
      const dark = i === 0;
      surface.style.background = dark ? '#000' : '#fff';
      const shades = dark ? [0, 2, 4, 6, 8, 10, 13, 16, 20] : [100, 98, 96, 94, 92, 90, 87, 84, 80];
      const row = el('div', { class: 'mt-fill' });
      shades.forEach((v) => {
        const cell = el('div', { class: 'mt-cell' }, `${v}٪`);
        cell.style.background = `hsl(0, 0%, ${v}%)`;
        cell.style.color = dark ? '#666' : '#999';
        row.append(cell);
      });
      surface.replaceChildren(row);
    },
    hud: (i) => (i === 0
      ? 'پله‌های نزدیک به سیاه — چند پله را می‌توانید از هم تشخیص دهید؟ کلیک برای حالت روشن'
      : 'پله‌های نزدیک به سفید — کلیک برای بازگشت به حالت تیره'),
  },

  sharpness: {
    steps: 1,
    render: (_, surface) => {
      surface.style.background = '#fff';
      surface.replaceChildren(
        el('div', { class: 'mt-lines' }),
        el('div', { class: 'mt-sample mt-sample--top' }, 'نمونه متن ریز برای بررسی تیزی — Sharpness 12px'),
        el('div', { class: 'mt-sample mt-sample--bottom' }, 'Sharpness Test 22px'),
      );
    },
    hud: () => 'الگوی خطوط باریک برای بررسی تاری یا موآره تصویر',
  },

  uniformity: (() => {
    const levels = [13, 25, 50, 75];
    return {
      steps: levels.length,
      render: (i, surface) => {
        surface.replaceChildren();
        surface.style.background = `hsl(0, 0%, ${levels[i]}%)`;
      },
      hud: (i) => `خاکستری ${levels[i]}٪ — ترجیحاً در اتاق تاریک، دنبال روشنایی نامنظم یا لکه بگردید (کلیک برای سطح بعدی)`,
    };
  })(),
};

function initTests() {
  const overlay = mustId('mt-overlay');
  const surface = mustId('mt-surface');
  const hud = mustId('mt-hud');
  const closeBtn = mustId('mt-close');

  let current = null; // نام تست باز
  let step = 0;
  let returnFocus = null;
  let idleTimer = 0;

  /** نوار راهنما و نشانگر موس پس از چند ثانیه محو می‌شوند تا روی پیکسل‌ها را نپوشانند. */
  function wake() {
    overlay.classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => overlay.classList.add('idle'), 2800);
  }

  function draw() {
    const test = TESTS[current];
    test.render(step, surface);
    hud.textContent = test.hud(step);
    wake();
  }

  function open(name) {
    if (!TESTS[name]) return;
    current = name;
    step = 0;
    returnFocus = document.activeElement;
    overlay.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    draw();
    closeBtn.focus({ preventScroll: true });
    overlay.requestFullscreen?.().catch(() => {}); // اگر مرورگر اجازه ندهد، همان پوشش تمام‌پنجره می‌ماند
  }

  function close() {
    if (!current) return;
    current = null;
    clearTimeout(idleTimer);
    overlay.hidden = true;
    surface.replaceChildren();
    surface.style.background = '#000';
    document.documentElement.style.overflow = '';
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    returnFocus?.focus?.({ preventScroll: true });
  }

  function go(delta) {
    const count = TESTS[current].steps;
    if (count <= 1) return;
    step = (step + delta + count) % count;
    draw();
  }

  $$('[data-test]').forEach((btn) => btn.addEventListener('click', () => open(btn.dataset.test)));
  surface.addEventListener('click', () => go(1));
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('pointermove', wake);

  // اگر کاربر با Esc از حالت تمام‌صفحه‌ی مرورگر خارج شد، تست را هم ببند
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && current) close();
  });

  document.addEventListener('keydown', (e) => {
    if (!current) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === ' ' || e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    } else if (e.key === 'Tab') {
      e.preventDefault(); // فوکوس فقط روی دکمه‌ی بستن بماند
      closeBtn.focus();
    } else {
      wake();
    }
  });
}

export function initMonitor() {
  initInfo();
  initTests();
}
