<?php
declare(strict_types=1);

/**
 * توابع مشترک endpointهای API. مستقیماً از مرورگر قابل‌دسترسی نیست (فقط include می‌شود).
 */

if (basename($_SERVER['SCRIPT_NAME'] ?? '') === '_bootstrap.php') {
    http_response_code(404);
    exit;
}

/** هدرهایی که هر پاسخ API را از کش مرورگر و پروکسی‌ها دور نگه می‌دارد. */
function no_cache_headers(): void
{
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');
    header('X-Content-Type-Options: nosniff');
}

/** پاسخ JSON با کد وضعیت مشخص. */
function json_response(array $payload, int $status = 200): never
{
    http_response_code($status);
    no_cache_headers();
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** فقط متدهای مجاز را می‌پذیرد، وگرنه 405. */
function require_method(string ...$allowed): void
{
    if (!in_array($_SERVER['REQUEST_METHOD'] ?? '', $allowed, true)) {
        header('Allow: ' . implode(', ', $allowed));
        json_response(['ok' => false, 'error' => 'method_not_allowed'], 405);
    }
}

/** جلوگیری از فشرده‌سازی خروجی — برای تست سرعت لازم است. */
function disable_compression(): void
{
    @ini_set('zlib.output_compression', '0');
    if (function_exists('apache_setenv')) {
        @apache_setenv('no-gzip', '1');
    }
    header('Content-Encoding: identity');
}

/** آیا درخواست از همین سایت آمده؟ (محافظت ساده در برابر ارسال از دامنه‌ی دیگر) */
function is_same_origin(): bool
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin === '') {
        return true; // مرورگرها برای درخواست هم‌مبدأ ساده Origin نمی‌فرستند
    }
    $originHost = parse_url($origin, PHP_URL_HOST);
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $host = preg_replace('/:\d+$/', '', $host) ?? '';
    return is_string($originHost) && strcasecmp($originHost, $host) === 0;
}

function client_ip(): string
{
    return (string)($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
}
