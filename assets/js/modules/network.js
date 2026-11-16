/**
 * تست سرعت و کیفیت اینترنت (پینگ، جیتر، ازدست‌رفتن بسته، دانلود، آپلود) نسبت به سرور همین سایت.
 *
 * دانلود و آپلود «زمان‌محور»اند: چند اتصال هم‌زمان حدود ۶ ثانیه داده جابه‌جا می‌کنند (با سقف حجم
 * برای محافظت از سرور و پهنای باند هاست)، و ابتدای انتقال از اندازه‌گیری کنار گذاشته می‌شود.
 */
import { byId, mustId } from '../lib/dom.js';
import { fmt } from '../lib/format.js';
import { setVerdict } from '../lib/status.js';
import { initGauges } from '../lib/gauge.js';
import { summarizePing, ratePing, rateDownload, rateUpload, overallVerdict, createMeter } from './net-rating.js';

const API = new URL('../../../api/', import.meta.url); // مستقل از مسیر نصب سایت

const PING_SAMPLES = 15;
const PING_TIMEOUT_MS = 3000;
const PING_GAP_MS = 120;

const TEST_MS = 6000;
const STREAMS = 3;
const DOWNLOAD_CHUNK_MB = 8;
const DOWNLOAD_CAP_BYTES = 96 * 1024 * 1024;
const UPLOAD_BLOCK_BYTES = 2 * 1024 * 1024;
const UPLOAD_CAP_BYTES = 48 * 1024 * 1024;

const abortError = () => new DOMException('Aborted', 'AbortError');
const isAbort = (e) => e?.name === 'AbortError';
const wait = (ms, signal) =>
  new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(t); resolve(); }, { once: true });
  });
const bust = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;

/* ==========================================================================
   اندازه‌گیری‌ها (هرکدام signal می‌گیرند تا بشود وسط کار متوقف‌شان کرد)
   ========================================================================== */

async function pingOnce(signal) {
  const ctl = new AbortController();
  const relay = () => ctl.abort();
  signal.addEventListener('abort', relay, { once: true });
  const timer = setTimeout(() => ctl.abort(), PING_TIMEOUT_MS);
  const start = performance.now();
  try {
    const res = await fetch(`${API}ping.php?_=${bust()}`, { cache: 'no-store', signal: ctl.signal });
    if (!res.ok) return null;
    return performance.now() - start;
  } catch {
    return null; // timeout یا خطا = بسته‌ی ازدست‌رفته (لغو کاربر را بالاتر تشخیص می‌دهیم)
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', relay);
  }
}

async function measureDownload(signal, onLive) {
  const ctl = new AbortController();
  const relay = () => ctl.abort();
  signal.addEventListener('abort', relay, { once: true });

  const meter = createMeter();
  const t0 = performance.now();
  meter.sample(0, t0);
  let total = 0;
  let ended = false;
  let failure = null;

  const finish = () => {
    if (ended) return;
    ended = true;
    ctl.abort();
  };
  const timer = setInterval(() => {
    const now = performance.now();
    const live = meter.sample(total, now);
    if (live !== null) onLive(live);
    if (now - t0 >= TEST_MS || total >= DOWNLOAD_CAP_BYTES) finish();
  }, 100);

  const worker = async () => {
    try {
      while (!ended) {
        const res = await fetch(`${API}download.php?mb=${DOWNLOAD_CHUNK_MB}&_=${bust()}`, { cache: 'no-store', signal: ctl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (!res.body?.getReader) {
          total += (await res.arrayBuffer()).byteLength;
          continue;
        }
        const reader = res.body.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          total += value.byteLength;
        }
      }
    } catch (err) {
      if (!ended) failure = err;
      finish();
    }
  };

  await Promise.all(Array.from({ length: STREAMS }, worker));
  clearInterval(timer);
  signal.removeEventListener('abort', relay);
  const now = performance.now();

  if (signal.aborted) throw abortError();
  if (failure && total === 0) throw failure;
  return meter.result(total, now);
}

/** بلوک تصادفی برای آپلود؛ یک‌بار ساخته می‌شود. (getRandomValues حداکثر ۶۴ کیلوبایت در هر فراخوانی می‌پذیرد.) */
let uploadBlob = null;
function getUploadBlob() {
  if (!uploadBlob) {
    const bytes = new Uint8Array(UPLOAD_BLOCK_BYTES);
    for (let offset = 0; offset < bytes.length; offset += 65536) crypto.getRandomValues(bytes.subarray(offset, offset + 65536));
    uploadBlob = new Blob([bytes], { type: 'application/octet-stream' });
  }
  return uploadBlob;
}

async function measureUpload(signal, onLive) {
  const blob = getUploadBlob();
  const meter = createMeter({ warmupBytes: 2 * 1024 * 1024 });
  const t0 = performance.now();
  meter.sample(0, t0);

  const inFlight = new Map(); // xhr → بایت‌های ارسال‌شده‌ی آن درخواست
  let completed = 0;
  let ended = false;
  let failure = null;
  const sent = () => completed + [...inFlight.values()].reduce((a, b) => a + b, 0);

  const finish = () => {
    if (ended) return;
    ended = true;
    inFlight.forEach((_, xhr) => xhr.abort());
  };
  const relay = () => finish();
  signal.addEventListener('abort', relay, { once: true });

  const timer = setInterval(() => {
    const now = performance.now();
    const total = sent();
    const live = meter.sample(total, now);
    if (live !== null) onLive(live);
    if (now - t0 >= TEST_MS || total >= UPLOAD_CAP_BYTES) finish();
  }, 100);

  const postOnce = () =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      inFlight.set(xhr, 0);
      xhr.upload.onprogress = (e) => inFlight.set(xhr, e.loaded);
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          completed += blob.size;
          inFlight.delete(xhr);
          resolve();
        } else {
          reject(new Error(`HTTP ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error('network'));
      xhr.onabort = () => resolve(); // بایت‌های جزئی در inFlight می‌مانند و حساب می‌شوند
      xhr.open('POST', `${API}upload.php?_=${bust()}`);
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');
      xhr.send(blob);
    });

  const worker = async () => {
    try {
      while (!ended) await postOnce();
    } catch (err) {
      if (!ended) failure = err;
      finish();
    }
  };

  await Promise.all(Array.from({ length: STREAMS }, worker));
  clearInterval(timer);
  signal.removeEventListener('abort', relay);
  const now = performance.now();

  if (signal.aborted) throw abortError();
  const total = sent();
  if (failure && total === 0) throw failure;
  return meter.result(total, now);
}

/* ==========================================================================
   رابط کاربری
   ========================================================================== */
export function initNetwork() {
  const gauges = initGauges();
  const startButtons = ['net-ping-start', 'net-dl-start', 'net-ul-start', 'net-run-all'].map(mustId);
  const stopBtn = mustId('net-stop');
  const verdicts = { ping: mustId('net-ping-verdict'), dl: mustId('net-dl-verdict'), ul: mustId('net-ul-verdict'), all: mustId('net-overall-verdict') };

  const results = {}; // { ping, download, upload } آخرین نتیجه‌ها
  let controller = null;

  const setRunning = (running) => {
    startButtons.forEach((b) => (b.disabled = running));
    stopBtn.disabled = !running;
  };

  /** اجرای یک تست با مدیریت دکمه‌ها و لغو */
  async function guarded(task) {
    if (controller) return;
    controller = new AbortController();
    setRunning(true);
    try {
      await task(controller.signal);
    } catch (err) {
      if (!isAbort(err)) console.error(err);
    } finally {
      controller = null;
      setRunning(false);
      updateOverall();
    }
  }

  function updateOverall() {
    const v = overallVerdict(results);
    if (v) setVerdict(verdicts.all, v.kind, v.text);
  }

  const apiHint = 'مطمئن شوید پوشه‌ی api/ روی سرور آپلود شده و PHP فعال است.';

  /* ---------- پینگ ---------- */
  async function runPing(signal) {
    gauges.ping.reset();
    setVerdict(verdicts.ping, null, 'در حال اندازه‌گیری...');
    await pingOnce(signal); // نمونه‌ی گرم‌کننده: هزینه‌ی برقراری اتصال را کنار می‌گذارد
    const samples = [];
    for (let i = 0; i < PING_SAMPLES; i++) {
      if (signal.aborted) throw abortError();
      const ms = await pingOnce(signal);
      if (signal.aborted) throw abortError();
      samples.push(ms);
      gauges.ping.set(ms ?? 200, 0);
      await wait(PING_GAP_MS, signal);
    }

    const s = summarizePing(samples);
    byId('net-ping-avg').textContent = s.avg !== null ? `${fmt(s.avg, 0)} ms` : '—';
    byId('net-ping-jitter').textContent = s.jitter !== null ? `${fmt(s.jitter, 1)} ms` : '—';
    byId('net-ping-min').textContent = s.min !== null ? `${fmt(s.min, 0)} ms` : '—';
    byId('net-ping-max').textContent = s.max !== null ? `${fmt(s.max, 0)} ms` : '—';
    byId('net-ping-loss').textContent = `${fmt(s.loss, 0)}٪`;

    if (s.avg === null) {
      setVerdict(verdicts.ping, 'fail', `هیچ پاسخی از سرور نیامد. ${apiHint}`);
      delete results.ping;
      return;
    }
    gauges.ping.set(s.avg, 0);
    results.ping = s;
    const { kind, label } = ratePing(s);
    setVerdict(verdicts.ping, kind, `کیفیت اتصال برای بازی آنلاین: ${label} (میانگین ${fmt(s.avg, 0)} میلی‌ثانیه، جیتر ${fmt(s.jitter, 1)} میلی‌ثانیه)`);
  }

  /* ---------- دانلود و آپلود ---------- */
  function speedTask({ key, measure, rate, gauge, verdict, title }) {
    return async (signal) => {
      gauge.reset();
      setVerdict(verdict, null, 'در حال اندازه‌گیری...');
      try {
        const mbps = await measure(signal, (live) => gauge.set(live, 1));
        gauge.set(mbps, 1);
        results[key] = mbps;
        const { kind, label } = rate(mbps);
        setVerdict(verdict, kind, `${title}: ${label} (${fmt(mbps, 1)} مگابیت بر ثانیه)`);
      } catch (err) {
        if (isAbort(err)) throw err;
        delete results[key];
        setVerdict(verdict, 'fail', `${title} ناموفق بود. ${apiHint}`);
      }
    };
  }

  const downloadTask = speedTask({ key: 'download', measure: measureDownload, rate: rateDownload, gauge: gauges.dl, verdict: verdicts.dl, title: 'سرعت دانلود' });
  const uploadTask = speedTask({ key: 'upload', measure: measureUpload, rate: rateUpload, gauge: gauges.ul, verdict: verdicts.ul, title: 'سرعت آپلود' });

  mustId('net-ping-start').addEventListener('click', () => guarded(runPing));
  mustId('net-dl-start').addEventListener('click', () => guarded(downloadTask));
  mustId('net-ul-start').addEventListener('click', () => guarded(uploadTask));
  mustId('net-run-all').addEventListener('click', () =>
    guarded(async (signal) => {
      await runPing(signal);
      await downloadTask(signal);
      await uploadTask(signal);
    }),
  );
  stopBtn.addEventListener('click', () => controller?.abort());
  window.addEventListener('pagehide', () => controller?.abort());
}
