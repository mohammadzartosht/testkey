/**
 * نقطه‌ی ورود: هر بخش را جداگانه راه‌اندازی می‌کند تا خطا در یکی بقیه را از کار نیندازد.
 */
import { $$ } from './lib/dom.js';
import { initReport } from './lib/report.js';
import { initMouse } from './modules/mouse.js';
import { initKeyboard } from './modules/keyboard.js';
import { initMonitor } from './modules/monitor.js';
import { initAudio } from './modules/audio.js';
import { initGamepad } from './modules/gamepad.js';
import { initWebcam } from './modules/webcam.js';
import { initNetwork } from './modules/network.js';
import { initFeedback } from './modules/feedback.js';

/** هایلایت بخشی از منوی بالا که در حال دیده‌شدن است */
function initNavHighlight() {
  const links = new Map($$('#section-nav a').map((a) => [a.getAttribute('href').slice(1), a]));
  const sections = [...links.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  if (!sections.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        links.forEach((a, id) => {
          const on = id === entry.target.id;
          a.classList.toggle('is-active', on);
          if (on) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
        links.get(entry.target.id)?.scrollIntoView({ block: 'nearest', inline: 'center' });
      }
    },
    { rootMargin: '-35% 0px -55% 0px' }, // بخشی «فعال» است که از نوار مرکزی صفحه رد شود
  );
  sections.forEach((s) => observer.observe(s));
}

const modules = [
  ['report', initReport],
  ['mouse', initMouse],
  ['keyboard', initKeyboard],
  ['monitor', initMonitor],
  ['audio', initAudio],
  ['gamepad', initGamepad],
  ['webcam', initWebcam],
  ['network', initNetwork],
  ['feedback', initFeedback],
  ['nav', initNavHighlight],
];

for (const [name, init] of modules) {
  try {
    init();
  } catch (err) {
    console.error(`[${name}] راه‌اندازی ناموفق بود:`, err);
  }
}
