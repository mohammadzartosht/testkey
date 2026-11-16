/**
 * موتور صدای مشترک (Web Audio).
 * - AudioContext فقط بعد از اولین تعامل کاربر ساخته می‌شود (قانون autoplay مرورگرها).
 * - صداهای مکان‌دار با PannerNode به‌صورت HRTF پخش می‌شوند تا روی هدفون استریو حس جهت بدهند.
 * - به‌جای سینوس خالص (که روی هدفون به‌سختی جهت‌یابی می‌شود) از پالس‌های نویز پهن‌باند استفاده می‌کنیم.
 */

let ctx = null;
let noise = null;

/** AudioContext را (در صورت نیاز) می‌سازد و بیدار می‌کند. در مرورگر بدون پشتیبانی null برمی‌گرداند. */
export function getContext() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC({ latencyHint: 'interactive' });
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export const hasContext = () => ctx !== null;

/** مختصات واحد از زاویه (درجه): ۰ = روبه‌رو، ۹۰ = راست، ۱۸۰ = پشت، ۲۷۰ = چپ */
export function positionFromAngle(angleDeg, distance = 1) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: Math.sin(rad) * distance, y: 0, z: -Math.cos(rad) * distance };
}

function setPosition(panner, { x, y, z }) {
  if (panner.positionX) {
    panner.positionX.value = x;
    panner.positionY.value = y;
    panner.positionZ.value = z;
  } else {
    panner.setPosition(x, y, z); // Safari قدیمی
  }
}

function createPanner(c, position) {
  const panner = c.createPanner();
  panner.panningModel = 'HRTF';
  panner.distanceModel = 'inverse';
  panner.refDistance = 1;
  setPosition(panner, position);
  return panner;
}

/** بافر نویز سفید یک‌ثانیه‌ای (کش می‌شود) */
function noiseBuffer(c) {
  if (!noise || noise.sampleRate !== c.sampleRate) {
    noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noise;
}

/** منبع نویز حلقه‌ای که از فیلتر پهن‌باند (۲۰۰ تا ۷۰۰۰ هرتز) رد می‌شود. خروجی: { source, out } */
function bandNoise(c) {
  const source = c.createBufferSource();
  source.buffer = noiseBuffer(c);
  source.loop = true;
  const hp = c.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 200;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 7000;
  source.connect(hp);
  hp.connect(lp);
  return { source, out: lp };
}

/**
 * یک صدای کوتاه (نوسان ساده) با پن استریو؛ برای تست چپ/راست و ساب‌ووفر.
 * @returns {{stop(): void}}
 */
export function playTone({ freq = 440, duration = 1, type = 'sine', pan = 0, volume = 0.25, harmonic = 0 }) {
  const c = getContext();
  if (!c) return { stop() {} };
  const now = c.currentTime;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.03);
  gain.gain.setValueAtTime(volume, now + Math.max(0.04, duration - 0.08));
  gain.gain.linearRampToValueAtTime(0, now + duration);

  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  const oscs = [osc];
  if (harmonic) {
    // هارمونیک سوم: فرکانس‌های خیلی پایین روی هدفون کم‌شنیدنی‌اند
    const h = c.createOscillator();
    const hg = c.createGain();
    hg.gain.value = harmonic;
    h.frequency.value = freq * 3;
    h.connect(hg);
    hg.connect(gain);
    oscs.push(h);
  }

  let out = gain;
  if (pan !== 0 && c.createStereoPanner) {
    const panner = c.createStereoPanner();
    panner.pan.value = pan;
    gain.connect(panner);
    out = panner;
  }
  out.connect(c.destination);
  oscs.forEach((o) => {
    o.start(now);
    o.stop(now + duration + 0.05);
  });
  return { stop: () => oscs.forEach((o) => { try { o.stop(); } catch { /* قبلاً متوقف شده */ } }) };
}

/**
 * قطار پالس نویز از یک جهت مشخص (HRTF).
 * @param {{angle:number, distance?:number, pulses?:number, volume?:number}} opts
 */
export function playBurst({ angle, distance = 1, pulses = 3, pulseMs = 120, gapMs = 90, volume = 0.5 }) {
  const c = getContext();
  if (!c) return { stop() {}, duration: 0 };
  const { source, out } = bandNoise(c);
  const gain = c.createGain();
  const now = c.currentTime;
  gain.gain.setValueAtTime(0, now);
  let t = now;
  for (let i = 0; i < pulses; i++) {
    gain.gain.linearRampToValueAtTime(volume, t + 0.012);
    gain.gain.setValueAtTime(volume, t + pulseMs / 1000 - 0.02);
    gain.gain.linearRampToValueAtTime(0, t + pulseMs / 1000);
    t += (pulseMs + gapMs) / 1000;
  }
  out.connect(gain);
  const panner = createPanner(c, positionFromAngle(angle, distance));
  gain.connect(panner);
  panner.connect(c.destination);
  source.start(now);
  source.stop(t + 0.05);
  return { stop: () => { try { source.stop(); } catch { /* قبلاً متوقف شده */ } }, duration: t - now };
}

/**
 * منبع صوتی پیوسته که می‌تواند دور سر بچرخد (تست سه‌بعدی).
 * @returns {{setAngle(deg:number): void, stop(): void}}
 */
export function startOrbit({ volume = 0.45 } = {}) {
  const c = getContext();
  if (!c) return { setAngle() {}, stop() {} };
  const { source, out } = bandNoise(c);
  const gain = c.createGain();
  gain.gain.value = volume * 0.55;

  // ضربان آرام دامنه، تا صدا پیوسته ولی قابل‌ردیابی باشد
  const lfo = c.createOscillator();
  const lfoDepth = c.createGain();
  lfo.frequency.value = 4;
  lfoDepth.gain.value = volume * 0.45;
  lfo.connect(lfoDepth);
  lfoDepth.connect(gain.gain);

  const panner = createPanner(c, positionFromAngle(0));
  out.connect(gain);
  gain.connect(panner);
  panner.connect(c.destination);
  source.start();
  lfo.start();

  return {
    setAngle: (deg) => setPosition(panner, positionFromAngle(deg)),
    stop() {
      try { source.stop(); lfo.stop(); } catch { /* قبلاً متوقف شده */ }
      panner.disconnect();
    },
  };
}

/* ---------- صدای پا ---------- */

const FOOTSTEP_FILES = ['footstep1.wav', 'footstep2.wav', 'footstep3.wav'];
const footsteps = [];
let footstepsRequested = false;

/** نمونه‌های واقعی صدای پا را یک‌بار بارگذاری می‌کند؛ اگر نشد، صدای ساختگی جایگزین می‌شود. */
export function preloadFootsteps() {
  const c = getContext();
  if (!c || footstepsRequested || !window.fetch) return;
  footstepsRequested = true;
  FOOTSTEP_FILES.forEach(async (file) => {
    try {
      const res = await fetch(new URL(`../../sounds/${file}`, import.meta.url));
      if (!res.ok) throw new Error(String(res.status));
      footsteps.push(await c.decodeAudioData(await res.arrayBuffer()));
    } catch {
      /* بی‌صدا به صدای ساختگی برمی‌گردیم */
    }
  });
}

function synthFootstep(c, panner, volume) {
  const source = c.createBufferSource();
  source.buffer = noiseBuffer(c);
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 500;
  const gain = c.createGain();
  const now = c.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  source.connect(lp);
  lp.connect(gain);
  gain.connect(panner);
  source.start(now);
  source.stop(now + 0.2);
}

/** یک قدم از زاویه و فاصله‌ی مشخص */
export function playFootstep({ angle, distance = 1, volume = 0.8 }) {
  const c = getContext();
  if (!c) return;
  preloadFootsteps();
  const panner = createPanner(c, positionFromAngle(angle, distance));
  panner.connect(c.destination);

  if (footsteps.length === 0) {
    synthFootstep(c, panner, volume * 0.75);
    return;
  }
  const source = c.createBufferSource();
  source.buffer = footsteps[Math.floor(Math.random() * footsteps.length)];
  const gain = c.createGain();
  gain.gain.value = volume;
  source.connect(gain);
  gain.connect(panner);
  source.start();
}
