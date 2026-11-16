<?php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';

/**
 * دریافت داده برای تست سرعت آپلود. داده فوراً دور ریخته می‌شود؛ چیزی روی دیسک یا در حافظه نگه داشته نمی‌شود.
 */
require_method('POST');

@set_time_limit(0);

const MAX_BYTES = 33554432; // 32MB

$declared = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($declared > MAX_BYTES) {
    json_response(['ok' => false, 'error' => 'payload_too_large'], 413);
}

// به‌جای بارگذاری کل بدنه در حافظه، تکه‌تکه می‌خوانیم و فقط می‌شماریم.
$in = fopen('php://input', 'rb');
$received = 0;
if ($in !== false) {
    while (!feof($in)) {
        $buf = fread($in, 65536);
        if ($buf === false) {
            break;
        }
        $received += strlen($buf);
        if ($received > MAX_BYTES) {
            break;
        }
    }
    fclose($in);
}

json_response(['ok' => true, 'bytes' => $received]);
