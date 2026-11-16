<?php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';

/**
 * داده‌ی باینریِ تصادفی برای تست سرعت دانلود.
 * استفاده: download.php?mb=8   (بین ۱ تا ۳۲ مگابایت؛ برای محافظت از سرور محدود می‌شود)
 */
require_method('GET', 'HEAD');

disable_compression();
@set_time_limit(0);
ignore_user_abort(false); // اگر کاربر تست را قطع کرد، ارسال هم متوقف شود

const MAX_MB     = 32;
const CHUNK_SIZE = 524288; // 512KB

$mb = filter_var($_GET['mb'] ?? 4, FILTER_VALIDATE_INT, ['options' => ['default' => 4]]);
$mb = max(1, min(MAX_MB, (int)$mb));
$total = $mb * 1024 * 1024;

no_cache_headers();
header('Content-Type: application/octet-stream');
header('Content-Length: ' . $total);
header('Content-Disposition: attachment; filename="speedtest.bin"');
header('X-Accel-Buffering: no'); // اگر nginx جلوی PHP باشد بافر نکند

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'HEAD') {
    exit;
}

// خروجی‌های بافرشده را خاموش می‌کنیم تا بایت‌ها همان لحظه از سرور خارج شوند
while (ob_get_level() > 0) {
    @ob_end_flush();
}

// یک بلوک تصادفی یک‌بار ساخته و تکرار می‌شود: مصرف CPU کم، ولی فشرده‌سازی در مسیر بی‌اثر.
$chunk = random_bytes(CHUNK_SIZE);
$sent = 0;

while ($sent < $total) {
    if (connection_aborted()) {
        break;
    }
    $remaining = $total - $sent;
    if ($remaining >= CHUNK_SIZE) {
        echo $chunk;
        $sent += CHUNK_SIZE;
    } else {
        echo substr($chunk, 0, $remaining);
        $sent += $remaining;
    }
    flush();
}
