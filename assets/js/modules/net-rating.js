/**
 * منطق خالص تست شبکه (بدون DOM و fetch): آمار پینگ، سرعت‌سنج و امتیازدهی.
 * جدا بودن این بخش باعث می‌شود بدون مرورگر هم بتوان آن را آزمایش کرد.
 */
import { mean } from '../lib/format.js';

/** @typedef {'pass'|'warn'|'fail'} Kind */

/**
 * آمار پینگ از فهرست نمونه‌ها. نمونه‌ی null یعنی بسته‌ی ازدست‌رفته.
 * جیتر = میانگین اختلاف مطلق نمونه‌های متوالی (مثل RFC 3550).
 */
export function summarizePing(samples) {
  const ok = samples.filter((s) => s !== null);
  let jitter = null;
  if (ok.length > 1) {
    const diffs = ok.slice(1).map((v, i) => Math.abs(v - ok[i]));
    jitter = mean(diffs);
  }
  return {
    count: samples.length,
    avg: mean(ok),
    min: ok.length ? Math.min(...ok) : null,
    max: ok.length ? Math.max(...ok) : null,
    jitter,
    loss: samples.length ? ((samples.length - ok.length) / samples.length) * 100 : 100,
  };
}

/** @returns {{kind: Kind, label: string}} */
export function ratePing({ avg, jitter, loss }) {
  if (avg === null || loss > 3 || avg > 100 || (jitter ?? 0) > 30) return { kind: 'fail', label: 'ضعیف' };
  if (avg > 60 || (jitter ?? 0) > 15 || loss > 1) return { kind: 'warn', label: 'متوسط' };
  if (avg > 30 || (jitter ?? 0) > 5) return { kind: 'pass', label: 'خوب' };
  return { kind: 'pass', label: 'عالی' };
}

export function rateDownload(mbps) {
  if (mbps < 5) return { kind: 'fail', label: 'ضعیف' };
  if (mbps < 25) return { kind: 'warn', label: 'متوسط' };
  if (mbps < 100) return { kind: 'pass', label: 'خوب' };
  return { kind: 'pass', label: 'عالی' };
}

export function rateUpload(mbps) {
  if (mbps < 2) return { kind: 'fail', label: 'ضعیف' };
  if (mbps < 10) return { kind: 'warn', label: 'متوسط' };
  if (mbps < 40) return { kind: 'pass', label: 'خوب' };
  return { kind: 'pass', label: 'عالی' };
}

const SEVERITY = { pass: 0, warn: 1, fail: 2 };

/**
 * جمع‌بندی گیمینگ از نتیجه‌ی هر تست (هرکدام که اجرا شده باشد).
 * @param {{ping?: ReturnType<typeof summarizePing>, download?: number, upload?: number}} results
 */
export function overallVerdict({ ping, download, upload }) {
  const ratings = [];
  const parts = [];
  if (ping) {
    ratings.push(ratePing(ping).kind);
    parts.push(`پینگ ${ping.avg !== null ? `${ping.avg.toFixed(0)} ms` : 'نامشخص'}`);
  }
  if (download !== undefined) {
    ratings.push(rateDownload(download).kind);
    parts.push(`دانلود ${download.toFixed(1)} Mbps`);
  }
  if (upload !== undefined) {
    ratings.push(rateUpload(upload).kind);
    parts.push(`آپلود ${upload.toFixed(1)} Mbps`);
  }
  if (!ratings.length) return null;

  const worst = ratings.reduce((a, b) => (SEVERITY[b] > SEVERITY[a] ? b : a), 'pass');
  const summary = {
    pass: 'اتصال شما برای بازی آنلاین رقابتی و استریم مناسب است.',
    warn: 'اتصال شما قابل‌قبول است ولی ممکن است در بازی‌های رقابتی یا استریم با کیفیت بالا محدودیت داشته باشید.',
    fail: 'اتصال شما احتمالاً برای بازی آنلاین یا استریم مشکل‌ساز خواهد بود.',
  }[worst];
  return { kind: worst, text: `${summary} (${parts.join('، ')})` };
}

/**
 * سرعت‌سنج: سرعت لحظه‌ای (میانگین نمایی) و سرعت نهایی را از روی «کل بایت‌های دریافتی تا حالا» می‌سازد.
 * ابتدای انتقال (اتصال، slow-start) از اندازه‌گیری نهایی کنار گذاشته می‌شود:
 * اندازه‌گیری وقتی شروع می‌شود که warmupMs گذشته یا warmupBytes منتقل شده باشد (هرکدام زودتر).
 */
export function createMeter({ warmupMs = 700, warmupBytes = 4 * 1024 * 1024, windowMs = 150 } = {}) {
  let t0 = null;
  let startT = null;
  let startBytes = 0;
  let lastT = 0;
  let lastBytes = 0;
  let ema = null;

  return {
    /** هر چند ده میلی‌ثانیه صدا بزنید. سرعت لحظه‌ای (Mbps) یا null را برمی‌گرداند. */
    sample(totalBytes, now) {
      if (t0 === null) {
        t0 = lastT = now;
        lastBytes = totalBytes;
      }
      if (startT === null && (now - t0 >= warmupMs || totalBytes >= warmupBytes)) {
        startT = now;
        startBytes = totalBytes;
      }
      const dt = now - lastT;
      if (dt >= windowMs) {
        const inst = ((totalBytes - lastBytes) * 8) / (dt * 1000); // بیت بر میلی‌ثانیه ÷ ۱۰۰۰ = مگابیت بر ثانیه
        ema = ema === null ? inst : ema * 0.6 + inst * 0.4;
        lastT = now;
        lastBytes = totalBytes;
      }
      return ema;
    },
    /** سرعت نهایی (Mbps). اگر پنجره‌ی اندازه‌گیری خیلی کوتاه باشد، از ابتدای تست حساب می‌شود. */
    result(totalBytes, now) {
      if (t0 === null) return 0;
      const useWindow = startT !== null && now - startT >= 300;
      const fromT = useWindow ? startT : t0;
      const fromBytes = useWindow ? startBytes : 0;
      const seconds = (now - fromT) / 1000;
      return seconds > 0 ? ((totalBytes - fromBytes) * 8) / 1e6 / seconds : 0;
    },
  };
}
