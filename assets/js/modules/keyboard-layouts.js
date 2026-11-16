/**
 * چیدمان صفحه‌کلیدها (داده‌ی خالص، بدون DOM).
 *
 * هر کلید: { code, label, u }  — code همان KeyboardEvent.code است، u عرض بر حسب «واحد کلید».
 * فاصله‌ی خالی: { spacer: true, u }
 * هر چیدمان آرایه‌ای از «خوشه»هاست و هر خوشه آرایه‌ای از ردیف‌ها (ردیف‌ها همه ۶ تا هستند و
 * ردیف‌های خوشه‌های کناری دقیقاً زیر ردیف متناظر بخش اصلی می‌نشینند).
 */

const key = (label, code, u = 1) => ({ code, label, u });
const gap = (u = 1) => ({ spacer: true, u });

const fKeys = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => key(`F${from + i}`, `F${from + i}`));

/* ---------- ردیف‌های بخش اصلی ---------- */
const ROW_FUNCTION = [key('Esc', 'Escape'), gap(1), ...fKeys(1, 4), gap(0.5), ...fKeys(5, 8), gap(0.5), ...fKeys(9, 12)]; // ۱۵ واحد

const digits = Array.from({ length: 10 }, (_, i) => key(String((i + 1) % 10), `Digit${(i + 1) % 10}`));
const ROW_NUMBER = [key('`', 'Backquote'), ...digits, key('-', 'Minus'), key('=', 'Equal'), key('⌫', 'Backspace', 2)];

const letters = (str) => [...str].map((c) => key(c, `Key${c}`));
const ROW_QWERTY = [key('Tab', 'Tab', 1.5), ...letters('QWERTYUIOP'), key('[', 'BracketLeft'), key(']', 'BracketRight'), key('\\', 'Backslash', 1.5)];
const ROW_HOME = [key('Caps', 'CapsLock', 1.75), ...letters('ASDFGHJKL'), key(';', 'Semicolon'), key("'", 'Quote'), key('Enter', 'Enter', 2.25)];
const rowShift = (rightShift) => [key('Shift', 'ShiftLeft', 2.25), ...letters('ZXCVBNM'), key(',', 'Comma'), key('.', 'Period'), key('/', 'Slash'), key('Shift', 'ShiftRight', rightShift)];

const ROW_BOTTOM_FULL = [
  key('Ctrl', 'ControlLeft', 1.25), key('Win', 'MetaLeft', 1.25), key('Alt', 'AltLeft', 1.25),
  key('Space', 'Space', 6.25),
  key('Alt', 'AltRight', 1.25), key('Win', 'MetaRight', 1.25), key('Menu', 'ContextMenu', 1.25), key('Ctrl', 'ControlRight', 1.25),
];

/* ---------- خوشه‌های کناری ---------- */
const NAV_CLUSTER = [
  [key('PrtSc', 'PrintScreen'), key('ScrLk', 'ScrollLock'), key('Pause', 'Pause')],
  [key('Ins', 'Insert'), key('Home', 'Home'), key('PgUp', 'PageUp')],
  [key('Del', 'Delete'), key('End', 'End'), key('PgDn', 'PageDown')],
  [gap(), gap(), gap()],
  [gap(), key('↑', 'ArrowUp'), gap()],
  [key('←', 'ArrowLeft'), key('↓', 'ArrowDown'), key('→', 'ArrowRight')],
];

const NUMPAD_CLUSTER = [
  [gap(), gap(), gap(), gap()],
  [key('Num', 'NumLock'), key('/', 'NumpadDivide'), key('*', 'NumpadMultiply'), key('-', 'NumpadSubtract')],
  [key('7', 'Numpad7'), key('8', 'Numpad8'), key('9', 'Numpad9'), key('+', 'NumpadAdd')],
  [key('4', 'Numpad4'), key('5', 'Numpad5'), key('6', 'Numpad6'), gap()],
  [key('1', 'Numpad1'), key('2', 'Numpad2'), key('3', 'Numpad3'), key('Ent', 'NumpadEnter')],
  [key('0', 'Numpad0', 2), key('.', 'NumpadDecimal'), gap()],
];

const mainRows = (rightShift) => [ROW_FUNCTION, ROW_NUMBER, ROW_QWERTY, ROW_HOME, rowShift(rightShift), ROW_BOTTOM_FULL];

/* ---------- ۷۵٪: یک بلوک ۱۶ واحدی با ستون کناری فشرده ---------- */
const LAYOUT_75 = [
  [key('Esc', 'Escape'), ...fKeys(1, 12), key('PrtSc', 'PrintScreen'), key('Ins', 'Insert'), key('Del', 'Delete')],
  [...ROW_NUMBER, key('Home', 'Home')],
  [...ROW_QWERTY, key('PgUp', 'PageUp')],
  [...ROW_HOME, key('PgDn', 'PageDown')],
  [...rowShift(1.75), key('↑', 'ArrowUp'), key('End', 'End')],
  [
    key('Ctrl', 'ControlLeft', 1.25), key('Win', 'MetaLeft', 1.25), key('Alt', 'AltLeft', 1.25), key('Space', 'Space', 6.25),
    key('Alt', 'AltRight'), key('Ctrl', 'ControlRight'), gap(),
    key('←', 'ArrowLeft'), key('↓', 'ArrowDown'), key('→', 'ArrowRight'),
  ],
];

/* ---------- ۶۰٪: بدون ردیف تابعی و بدون کلیدهای کناری ---------- */
const LAYOUT_60 = [
  [key('Esc', 'Escape'), ...ROW_NUMBER.slice(1)], // Esc جای ` (مثل ۶۰٪ واقعی)
  ROW_QWERTY,
  ROW_HOME,
  rowShift(2.75),
  ROW_BOTTOM_FULL,
];

export const LAYOUTS = {
  full: { label: '۱۰۰٪', clusters: [mainRows(2.75), NAV_CLUSTER, NUMPAD_CLUSTER] },
  tkl: { label: '۸۰٪', clusters: [mainRows(2.75), NAV_CLUSTER] },
  seventyfive: { label: '۷۵٪', clusters: [LAYOUT_75] },
  sixty: { label: '۶۰٪', clusters: [LAYOUT_60] },
};

/** کدهای یکتای هر چیدمان (بدون فاصله‌ها) */
export function codesOf(layoutId) {
  const codes = new Set();
  for (const cluster of LAYOUTS[layoutId].clusters) {
    for (const row of cluster) for (const k of row) if (!k.spacer) codes.add(k.code);
  }
  return codes;
}

/** پهنای هر ردیف بر حسب واحد؛ برای تست هم‌ترازی در آزمایش‌ها */
export const rowWidth = (row) => row.reduce((sum, k) => sum + k.u, 0);
