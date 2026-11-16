/**
 * ابزارهای کوچک DOM. هیچ‌جا از innerHTML استفاده نمی‌کنیم؛ همه‌چیز با textContent و
 * createElement ساخته می‌شود تا هم امن باشد و هم با CSP سخت‌گیرانه‌ی سایت سازگار بماند.
 */

export const byId = (id) => document.getElementById(id);
export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

/** عنصری را که حتماً باید در صفحه باشد برمی‌گرداند؛ در غیر این صورت خطای واضح می‌دهد. */
export function mustId(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`عنصر #${id} در صفحه پیدا نشد`);
  return node;
}

/** ساخت عنصر: el('div', { class: 'x', dataset: { a: 1 } }, 'متن', childNode) */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key === 'style') Object.assign(node.style, value);
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  node.append(...children.flat().filter((c) => c !== null && c !== undefined && c !== false));
  return node;
}

/** ساخت عنصر SVG */
export function svg(tag, attrs = {}) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** آیا هدف رویداد یک کادر ورودی/متن است؟ (برای نادیده گرفتن تست‌های ماوس و کیبورد) */
export function isEditable(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]'));
}

/** آیا پوشش تمام‌صفحه‌ی تست مانیتور باز است؟ */
export function isOverlayOpen() {
  const overlay = document.getElementById('mt-overlay');
  return Boolean(overlay && !overlay.hidden);
}

let toastTimer = 0;
/** پیام کوتاه پایین صفحه */
export function toast(message, ms = 1800) {
  const node = byId('toast');
  if (!node) return;
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('show'), ms);
}
