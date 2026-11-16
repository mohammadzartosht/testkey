<?php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';

/**
 * دریافت پیام از فرم نظرات و ارسال آن با ایمیل.
 * ورودی: POST (فرم یا JSON) با فیلدهای name, email, message, page, website(honeypot), ts
 * خروجی: JSON { ok: bool, error?: string }
 */
require_method('POST');

$config = require dirname(__DIR__) . '/config.php';
date_default_timezone_set($config['timezone']);

if (!is_same_origin()) {
    json_response(['ok' => false, 'error' => 'forbidden'], 403);
}

// ---------- خواندن ورودی (JSON یا فرم) ----------
$input = $_POST;
if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false) {
    $decoded = json_decode((string)file_get_contents('php://input', false, null, 0, 20000), true);
    $input = is_array($decoded) ? $decoded : [];
}

$field = static fn(string $key, int $max): string =>
    mb_substr(trim((string)($input[$key] ?? '')), 0, $max);

// ---------- ضد اسپم: honeypot ----------
// کاربر واقعی فیلد پنهان را پر نمی‌کند. به ربات‌ها موفقیت نشان می‌دهیم تا دوباره تلاش نکنند.
if ($field('website', 200) !== '') {
    json_response(['ok' => true]);
}

// ---------- ضد اسپم: زمان پر کردن فرم ----------
// فرمی که کمتر از ۳ ثانیه بعد از بارگذاری صفحه ارسال شود، کار ربات است.
$openedAt = (int)($input['ts'] ?? 0);
if ($openedAt > 0 && (time() - intdiv($openedAt, 1000)) < 3) {
    json_response(['ok' => true]);
}

// ---------- پاک‌سازی و اعتبارسنجی ----------
$stripLines = static fn(string $v): string => trim((string)preg_replace('/[\r\n\t]+/', ' ', $v));

$name    = $stripLines($field('name', 80));
$email   = $stripLines($field('email', 120));
$page    = $stripLines($field('page', 300));
$message = $field('message', 4000);

if ($message === '') {
    json_response(['ok' => false, 'error' => 'empty_message'], 422);
}
$validEmail = $email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) !== false;

// ---------- محدودیت نرخ: هر کاربر حداکثر یک پیام در ۳۰ ثانیه و ۸ پیام در ساعت ----------
$rateFile = sys_get_temp_dir() . '/tsx_fb_' . hash('sha256', client_ip() . '|' . ($config['site_url'])) . '.json';
$now = time();
$hits = [];
if (is_file($rateFile)) {
    $hits = json_decode((string)@file_get_contents($rateFile), true);
    $hits = is_array($hits) ? array_values(array_filter($hits, static fn($t) => is_int($t) && $now - $t < 3600)) : [];
}
if ($hits !== [] && $now - max($hits) < 30) {
    json_response(['ok' => false, 'error' => 'too_fast'], 429);
}
if (count($hits) >= 8) {
    json_response(['ok' => false, 'error' => 'rate_limited'], 429);
}

// ---------- ساخت ایمیل ----------
$host = strtolower((string)preg_replace('/[^a-z0-9.\-]/i', '', preg_replace('/:\d+$/', '', (string)($_SERVER['HTTP_HOST'] ?? 'localhost'))));
$host = preg_replace('/^www\./', '', $host) ?: 'localhost';
$ua   = $stripLines(mb_substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 200));

$subject = mb_encode_mimeheader('پیام جدید از فرم نظرات - ' . $config['site_name'], 'UTF-8');

$body = implode("\n", [
    'یک پیام جدید از فرم نظرات صفحه‌ی تست سخت‌افزار دریافت شد.',
    '',
    'نام: ' . ($name !== '' ? $name : '(وارد نشده)'),
    'ایمیل: ' . ($validEmail ? $email : '(وارد نشده یا نامعتبر)'),
    'صفحه: ' . ($page !== '' ? $page : '(نامشخص)'),
    'مرورگر: ' . ($ua !== '' ? $ua : '(نامشخص)'),
    'زمان: ' . date('Y-m-d H:i:s'),
    '',
    'پیام:',
    $message,
]);

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: no-reply@' . $host,
];
if ($validEmail) {
    $headers[] = 'Reply-To: ' . $email;
}

$sent = @mail($config['feedback_to'], $subject, $body, implode("\r\n", $headers));

if (!$sent) {
    // ارسال ناموفق در سهمیه‌ی کاربر حساب نمی‌شود
    error_log('[feedback] mail() failed — check the server mail configuration');
    json_response(['ok' => false, 'error' => 'mail_failed'], 500);
}

$hits[] = $now;
@file_put_contents($rateFile, json_encode($hits), LOCK_EX);

json_response(['ok' => true]);
