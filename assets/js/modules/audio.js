/**
 * تست صدا: چپ/راست، ۷.۱ (HRTF)، چرخش سه‌بعدی، شبیه‌ساز صدای پا و میکروفن.
 */
import { byId, mustId, $$, el, sleep, clamp } from '../lib/dom.js';
import * as engine from '../lib/audio-engine.js';

/** ترتیب پخش توالی ۷.۱ */
const SEQUENCE = ['fl', 'c', 'fr', 'sr', 'rr', 'rl', 'sl'];

export function initAudio() {
  /* ---------- نقشه‌ی بلندگوها از روی خود HTML ---------- */
  const speakers = {};
  $$('[data-speaker]').forEach((node) => {
    speakers[node.dataset.speaker] = { id: node.dataset.speaker, node, angle: Number(node.dataset.angle), label: node.dataset.label };
  });
  const lfeDot = mustId('aud-lfe-dot');
  const clearDots = () => {
    Object.values(speakers).forEach((s) => s.node.classList.remove('active'));
    lfeDot.classList.remove('active');
  };
  const light = (id) => {
    clearDots();
    speakers[id]?.node.classList.add('active');
  };

  /* ---------- باز شدن AudioContext بعد از اولین تعامل ---------- */
  function unlock() {
    const ctx = engine.getContext();
    if (!ctx) {
      byId('aud-samplerate').textContent = 'پشتیبانی نمی‌شود';
      return;
    }
    byId('aud-samplerate').textContent = `${ctx.sampleRate} Hz`;
    byId('aud-maxchannels').textContent = ctx.destination.maxChannelCount || 2;
    engine.preloadFootsteps();
  }
  const unlockOnce = () => {
    unlock();
    ['pointerdown', 'keydown'].forEach((ev) => document.removeEventListener(ev, unlockOnce, true));
  };
  ['pointerdown', 'keydown'].forEach((ev) => document.addEventListener(ev, unlockOnce, true));

  /* ---------- چپ / راست ---------- */
  const liveLR = mustId('aud-live-lr');
  let lrTimer = 0;
  const LR = {
    left: { pan: -1, text: 'در حال پخش: کانال چپ' },
    right: { pan: 1, text: 'در حال پخش: کانال راست' },
    both: { pan: 0, text: 'در حال پخش: هر دو کانال' },
  };
  $$('[data-chan]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const { pan, text } = LR[btn.dataset.chan];
      engine.playTone({ freq: 420, duration: 1.1, pan, volume: 0.25 });
      liveLR.textContent = text;
      liveLR.classList.add('on');
      clearTimeout(lrTimer);
      lrTimer = setTimeout(() => liveLR.classList.remove('on'), 1100);
    }),
  );

  /* ---------- توالی ۷.۱ ---------- */
  const start71 = mustId('aud-71-start');
  const stop71 = mustId('aud-71-stop');
  const live71 = mustId('aud-live-71');
  let run71 = 0; // شماره‌ی اجرا؛ توقف آن را عوض می‌کند تا حلقه‌ی قبلی خودش را متوقف کند
  let burst71 = null;

  function set71Busy(busy) {
    start71.disabled = busy;
    stop71.disabled = !busy;
  }

  start71.addEventListener('click', async () => {
    const id = ++run71;
    set71Busy(true);
    for (const speakerId of SEQUENCE) {
      if (id !== run71) return;
      const s = speakers[speakerId];
      light(speakerId);
      live71.textContent = `در حال پخش: ${s.label}`;
      burst71 = engine.playBurst({ angle: s.angle, volume: 0.55 });
      await sleep(1250);
    }
    if (id !== run71) return;
    clearDots();
    lfeDot.classList.add('active');
    live71.textContent = 'در حال پخش: ساب‌ووفر (LFE)';
    burst71 = engine.playTone({ freq: 60, duration: 1.1, volume: 0.4, harmonic: 0.35 });
    await sleep(1400);
    if (id !== run71) return;
    finish71('توالی تمام شد');
  });

  function finish71(message) {
    run71++;
    burst71?.stop();
    clearDots();
    set71Busy(false);
    live71.textContent = message;
  }
  stop71.addEventListener('click', () => finish71('متوقف شد'));

  /* ---------- چرخش سه‌بعدی ---------- */
  const start3d = mustId('aud-3d-start');
  const stop3d = mustId('aud-3d-stop');
  const live3d = mustId('aud-live-3d');
  const ORBIT_SECONDS = 6;
  let orbit = null;
  let orbitFrame = 0;

  /** نزدیک‌ترین بلندگو به یک زاویه (فاصله‌ی دایره‌ای) */
  function nearestSpeaker(angle) {
    let best = null;
    let bestDiff = 361;
    for (const s of Object.values(speakers)) {
      const diff = Math.abs(((angle - s.angle + 540) % 360) - 180); // فاصله‌ی زاویه‌ای ۰..۱۸۰
      if (diff < bestDiff) {
        bestDiff = diff;
        best = s;
      }
    }
    return best.id;
  }

  start3d.addEventListener('click', () => {
    if (!engine.getContext()) return;
    orbit = engine.startOrbit();
    start3d.disabled = true;
    stop3d.disabled = false;
    const t0 = performance.now();
    const frame = (ts) => {
      const angle = (((ts - t0) / 1000 / ORBIT_SECONDS) * 360) % 360;
      orbit.setAngle(angle);
      light(nearestSpeaker(angle));
      live3d.textContent = `زاویه تقریبی: ${Math.round(angle)}°`;
      orbitFrame = requestAnimationFrame(frame);
    };
    orbitFrame = requestAnimationFrame(frame);
  });
  stop3d.addEventListener('click', () => {
    cancelAnimationFrame(orbitFrame);
    orbit?.stop();
    orbit = null;
    clearDots();
    start3d.disabled = false;
    stop3d.disabled = true;
    live3d.textContent = 'متوقف شد';
  });

  /* ---------- صدای پا ---------- */
  const liveStep = mustId('aud-live-step');
  const DIRECTION_NAMES = { fl: 'جلو-چپ', c: 'جلو', fr: 'جلو-راست', sr: 'کنار-راست', rr: 'پشت-راست', rl: 'پشت-چپ', sl: 'کنار-چپ' };
  let passbyTimers = [];

  mustId('aud-step-random').addEventListener('click', () => {
    const ids = Object.keys(speakers);
    const s = speakers[ids[Math.floor(Math.random() * ids.length)]];
    light(s.id);
    engine.playFootstep({ angle: s.angle, volume: 0.8 });
    setTimeout(() => engine.playFootstep({ angle: s.angle, volume: 0.65 }), 330);
    liveStep.textContent = `جهت صدای پا: ${DIRECTION_NAMES[s.id]}`;
  });

  mustId('aud-step-passby').addEventListener('click', () => {
    if (!engine.getContext()) return;
    passbyTimers.forEach(clearTimeout);
    passbyTimers = [];
    liveStep.textContent = 'در حال رد شدن از کنار...';
    const steps = 6;
    const [from, to] = [-100, 100]; // از پشت-چپ تا جلو-راست
    for (let i = 0; i <= steps; i++) {
      const angle = from + (to - from) * (i / steps);
      const distance = 1.4 - Math.sin((i / steps) * Math.PI) * 0.7; // وسط مسیر نزدیک‌تر
      passbyTimers.push(setTimeout(() => engine.playFootstep({ angle, distance, volume: 0.7 }), i * 380));
    }
    passbyTimers.push(setTimeout(() => (liveStep.textContent = 'رد شد'), steps * 380 + 300));
  });

  /* ---------- میکروفن ---------- */
  initMic();
}

function initMic() {
  const SEGMENTS = 20;
  const meter = mustId('aud-meter');
  const segs = Array.from({ length: SEGMENTS }, () => el('div', { class: 'seg' }));
  meter.replaceChildren(...segs);

  const startBtn = mustId('aud-mic-start');
  const recordBtn = mustId('aud-mic-record');
  const stopBtn = mustId('aud-mic-stop');
  const live = mustId('aud-live-mic');
  const stateEl = mustId('aud-micstate');
  const deviceEl = mustId('aud-mic-device');

  let stream = null;
  let analyser = null;
  let raf = 0;
  let lastText = 0;
  let peak = 0;

  const setButtons = (running) => {
    startBtn.disabled = running;
    recordBtn.disabled = !running;
    stopBtn.disabled = !running;
  };

  function draw(ts) {
    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (const v of buf) sum += v * v;
    const rms = Math.sqrt(sum / buf.length);
    const db = Math.max(-90, rms > 0 ? 20 * Math.log10(rms) : -90); // کف نمایش: ‎−۹۰ dB
    const level = clamp((db + 60) / 60, 0, 1); // −۶۰ تا ۰ دسی‌بل
    peak = Math.max(level, peak - 0.012);

    const lit = Math.round(level * SEGMENTS);
    segs.forEach((seg, i) => {
      const on = i < lit;
      seg.classList.toggle('lit', on);
      seg.classList.toggle('mid', on && i >= SEGMENTS * 0.6 && i < SEGMENTS * 0.85);
      seg.classList.toggle('hot', on && i >= SEGMENTS * 0.85);
    });
    meter.setAttribute('aria-valuenow', String(Math.round(level * 100)));

    if (ts - lastText > 150 && !recording) {
      live.textContent = `میکروفن فعال است — سطح: ${Math.round(db)} dB (اوج ${Math.round(peak * 60 - 60)} dB)`;
      lastText = ts;
    }
    raf = requestAnimationFrame(draw);
  }

  startBtn.addEventListener('click', async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      live.textContent = 'مرورگر شما از دسترسی میکروفن پشتیبانی نمی‌کند';
      return;
    }
    try {
      // پردازش‌های خودکار را خاموش می‌کنیم تا سیگنال واقعی میکروفن دیده شود
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      } catch (err) {
        if (err.name !== 'OverconstrainedError') throw err;
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch {
      live.textContent = 'دسترسی به میکروفن رد شد یا میکروفنی پیدا نشد';
      stateEl.textContent = 'رد شد';
      return;
    }
    const ctx = engine.getContext();
    analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    ctx.createMediaStreamSource(stream).connect(analyser); // عمداً به خروجی وصل نمی‌شود
    const track = stream.getAudioTracks()[0];
    track.addEventListener('ended', stopMic); // مثلاً وقتی میکروفن از سیستم جدا شود
    deviceEl.textContent = track.label || 'میکروفن پیش‌فرض';
    deviceEl.title = deviceEl.textContent;
    stateEl.textContent = 'فعال';
    setButtons(true);
    peak = 0;
    raf = requestAnimationFrame(draw);
  });

  let recording = false;
  recordBtn.addEventListener('click', () => {
    if (!stream || recording || !window.MediaRecorder) return;
    const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find((m) => MediaRecorder.isTypeSupported(m));
    const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = () => {
      recording = false;
      recordBtn.disabled = !stream;
      const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.addEventListener('ended', () => URL.revokeObjectURL(url), { once: true });
      audio.play().then(
        () => { live.textContent = 'در حال پخش صدای ضبط‌شده...'; },
        () => { live.textContent = 'پخش خودکار توسط مرورگر مسدود شد.'; URL.revokeObjectURL(url); },
      );
    };
    recording = true;
    recordBtn.disabled = true;
    recorder.start();
    let left = 3;
    live.textContent = `در حال ضبط... (${left} ثانیه)`;
    const tick = setInterval(() => {
      left -= 1;
      if (left > 0) live.textContent = `در حال ضبط... (${left} ثانیه)`;
      else clearInterval(tick);
    }, 1000);
    setTimeout(() => recorder.state !== 'inactive' && recorder.stop(), 3000);
  });

  function stopMic() {
    cancelAnimationFrame(raf);
    segs.forEach((s) => s.classList.remove('lit', 'mid', 'hot'));
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    analyser = null;
    setButtons(false);
    deviceEl.textContent = '—';
    stateEl.textContent = 'آماده';
    live.textContent = 'میکروفن غیرفعال است';
  }
  stopBtn.addEventListener('click', stopMic);
  window.addEventListener('pagehide', stopMic);
}
