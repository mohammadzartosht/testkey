<?php
declare(strict_types=1);

/**
 * صفحه‌ی اصلی ابزار تست سخت‌افزار و اینترنت — فروشگاه توس آراکس.
 * این فایل فقط پوسته‌ی صفحه را می‌سازد؛ هر بخش در پوشه‌ی views/ قرار دارد
 * و منطق مرورگر در assets/js/ است.
 */

$config = require __DIR__ . '/config.php';
$faq    = require __DIR__ . '/content/faq.php';
date_default_timezone_set($config['timezone']);

/** escape امن برای خروجی HTML */
function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** آدرس فایل استاتیک به‌همراه نسخه (زمان تغییر) برای شکستن کش */
function asset(string $path): string
{
    $file = __DIR__ . '/' . $path;
    return e($path . (is_file($file) ? '?v=' . filemtime($file) : ''));
}

/** خروجی JSON امن برای قرار دادن داخل <script type="application/ld+json"> */
function ld_json(array $data): string
{
    return json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_PRETTY_PRINT);
}

// ---------- هدرهای امنیتی ----------
header('Content-Type: text/html; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: camera=(self), microphone=(self), gamepad=(self), fullscreen=(self), geolocation=(), payment=()');
header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'");

// ---------- داده‌ی ساختاریافته (SEO) ----------
$schemaApp = [
    '@context'            => 'https://schema.org',
    '@type'               => 'WebApplication',
    'name'                => 'تست آنلاین ماوس، کیبورد و مانیتور',
    'url'                 => $config['canonical'],
    'applicationCategory' => 'UtilitiesApplication',
    'operatingSystem'     => 'هر سیستم‌عاملی با مرورگر وب',
    'inLanguage'          => 'fa',
    'isAccessibleForFree' => true,
    'description'         => $config['schema_description'],
    'provider'            => [
        '@type' => 'Organization',
        'name'  => $config['site_name'],
        'url'   => $config['site_url'],
    ],
];
$schemaFaq = [
    '@context'   => 'https://schema.org',
    '@type'      => 'FAQPage',
    'mainEntity' => array_map(static fn(array $item): array => [
        '@type'          => 'Question',
        'name'           => $item['q'],
        'acceptedAnswer' => ['@type' => 'Answer', 'text' => $item['a']],
    ], $faq),
];
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= e($config['page_title']) ?></title>
<meta name="description" content="<?= e($config['description']) ?>">
<meta name="keywords" content="<?= e($config['keywords']) ?>">
<meta name="author" content="<?= e($config['site_name']) ?>">
<meta name="robots" content="index, follow">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#0f1213">
<link rel="canonical" href="<?= e($config['canonical']) ?>">

<meta property="og:type" content="website">
<meta property="og:locale" content="fa_IR">
<meta property="og:site_name" content="<?= e($config['site_name']) ?>">
<meta property="og:title" content="<?= e($config['og_title']) ?>">
<meta property="og:description" content="<?= e($config['og_description']) ?>">
<meta property="og:url" content="<?= e($config['canonical']) ?>">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="<?= e($config['og_title']) ?>">
<meta name="twitter:description" content="<?= e($config['og_description']) ?>">

<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%230f1213'/%3E%3Ccircle cx='16' cy='16' r='7' fill='%23ffb020'/%3E%3C/svg%3E">

<script type="application/ld+json"><?= ld_json($schemaApp) ?></script>
<script type="application/ld+json"><?= ld_json($schemaFaq) ?></script>

<link rel="stylesheet" href="<?= asset('assets/css/style.css') ?>">
<script type="module" src="<?= asset('assets/js/main.js') ?>"></script>
</head>
<body>
<a class="skip-link" href="#main">پرش به محتوای اصلی</a>

<div class="wrap">

  <div class="top-bar">
    <span class="brand-label"><span class="brand-mark" aria-hidden="true"></span><?= e($config['site_name']) ?></span>
    <span class="version num">v<?= e($config['version']) ?></span>
  </div>

  <nav class="section-nav" id="section-nav" aria-label="پیمایش سریع بخش‌ها">
    <a href="#section-mouse">تست ماوس</a>
    <a href="#section-keyboard">تست کیبورد</a>
    <a href="#section-monitor">تست مانیتور</a>
    <a href="#section-audio">تست صدا</a>
    <a href="#section-gamepad">تست دسته بازی</a>
    <a href="#section-webcam">تست وب‌کم</a>
    <a href="#section-network">تست سرعت اینترنت</a>
    <a href="#section-feedback">ثبت نظر</a>
  </nav>

  <main id="main">
    <header class="page-head">
      <h1>میز تست ماوس و کیبورد</h1>
      <p>دکمه‌های ماوس، دبل‌کلیک، چرخ اسکرول و صفحه‌کلید خود را آزمایش کنید. سیستم به‌طور خودکار وضعیت هر بخش را تحلیل می‌کند.</p>
    </header>

    <noscript>
      <div class="notice notice--fail">برای استفاده از این ابزار باید جاوااسکریپت مرورگر فعال باشد.</div>
    </noscript>

    <div class="instructions">
      <strong>راهنما:</strong> در هر جای این صفحه کلیک کنید تا دکمه‌های ماوس ثبت شوند. برای تست دبل‌کلیک و اسکرول از کادرهای مخصوص و برای تست کیبورد از تصویر صفحه‌کلید پایین‌تر استفاده کنید.
    </div>

    <?php
    include __DIR__ . '/views/mouse.php';
    include __DIR__ . '/views/keyboard.php';
    include __DIR__ . '/views/monitor.php';
    include __DIR__ . '/views/audio.php';
    include __DIR__ . '/views/gamepad.php';
    include __DIR__ . '/views/webcam.php';
    include __DIR__ . '/views/network.php';
    include __DIR__ . '/views/report.php';
    include __DIR__ . '/views/about.php';
    include __DIR__ . '/views/faq.php';
    include __DIR__ . '/views/feedback.php';
    ?>
  </main>

  <footer class="site-footer">
    <p>این ابزار بر اساس رفتار مرورگر شما تشخیص تقریبی می‌دهد و جایگزین بررسی فیزیکی سخت‌افزار نیست.</p>
    <p>© <span class="num" id="copyright-year"><?= date('Y') ?></span> <?= e($config['site_name']) ?> — تمام حقوق محفوظ است.</p>
  </footer>
</div>

<div class="toast" id="toast" role="status" aria-live="polite"></div>

<div class="mt-overlay" id="mt-overlay" role="dialog" aria-modal="true" aria-label="تست تمام‌صفحه مانیتور" hidden>
  <div class="mt-surface" id="mt-surface"></div>
  <div class="mt-hud" id="mt-hud"></div>
  <button type="button" class="mt-close" id="mt-close">✕ بستن (Esc)</button>
</div>

</body>
</html>
