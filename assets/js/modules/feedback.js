/**
 * فرم نظرات: اعتبارسنجی سمت کاربر + ارسال JSON به api/feedback.php.
 */
import { mustId } from '../lib/dom.js';

const ENDPOINT = new URL('../../../api/feedback.php', import.meta.url);

const MESSAGES = {
  empty: 'لطفاً پیام خود را بنویسید.',
  sending: 'در حال ارسال...',
  ok: 'پیام شما ارسال شد. ممنون از وقتی که گذاشتید!',
  fail: 'ارسال پیام ناموفق بود. لطفاً دوباره تلاش کنید.',
  tooFast: 'پیام قبلی شما به‌تازگی ارسال شده؛ کمی بعد دوباره تلاش کنید.',
  offline: 'ارتباط با سرور برقرار نشد. اتصال اینترنت و وجود پوشه‌ی api/ روی سرور را بررسی کنید.',
};

export function initFeedback() {
  const form = mustId('feedback-form');
  const status = mustId('fb-status');
  const submit = mustId('fb-submit');
  const message = mustId('fb-message');
  const counter = mustId('fb-count');
  const openedAt = Date.now(); // برای تشخیص ارسال خودکار (خیلی سریع) در سرور

  const show = (text, kind = '') => {
    status.textContent = text;
    status.className = `feedback-status ${kind}`.trim();
  };

  message.addEventListener('input', () => {
    counter.textContent = `${message.value.length} / ${message.maxLength}`;
    message.closest('.field').classList.remove('is-invalid');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const text = String(data.get('message') ?? '').trim();

    if (!text) {
      message.closest('.field').classList.add('is-invalid');
      show(MESSAGES.empty, 'fail');
      message.focus();
      return;
    }

    submit.disabled = true;
    show(MESSAGES.sending);

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(data.get('name') ?? '').trim(),
          email: String(data.get('email') ?? '').trim(),
          message: text,
          website: String(data.get('website') ?? ''), // honeypot
          page: location.href,
          ts: openedAt,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok) {
        show(MESSAGES.ok, 'pass');
        form.reset();
        counter.textContent = `0 / ${message.maxLength}`;
      } else {
        show(res.status === 429 ? MESSAGES.tooFast : MESSAGES.fail, 'fail');
      }
    } catch {
      show(MESSAGES.offline, 'fail');
    } finally {
      submit.disabled = false;
    }
  });
}
