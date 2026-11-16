/**
 * وضعیت‌های تست: pending / pass / warn / fail
 * هر «خط وضعیت» عنصری است با یک .dot و یک .status__text؛ رنگ نقطه با data-kind کنترل می‌شود.
 */

export const KIND_LABEL = {
  pass: 'تأیید شد',
  warn: 'هشدار',
  fail: 'خرابی احتمالی',
  pending: 'در انتظار تست',
};

export const kindLabel = (kind) => KIND_LABEL[kind] ?? KIND_LABEL.pending;

/** @param {HTMLElement} node عنصر .status  @param {'pending'|'pass'|'warn'|'fail'} kind */
export function setStatus(node, kind, text) {
  node.dataset.kind = kind;
  const textNode = node.querySelector('.status__text');
  if (textNode) textNode.textContent = text;
}

export const getKind = (node) => node.dataset.kind || 'pending';

/** رنگ‌دهی کادر نتیجه (.verdict-box) */
export function setVerdict(node, kind, text) {
  node.classList.remove('pass', 'warn', 'fail');
  if (kind && kind !== 'pending') node.classList.add(kind);
  node.textContent = text;
}
