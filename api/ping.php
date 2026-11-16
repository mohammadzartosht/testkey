<?php
declare(strict_types=1);

/**
 * endpoint حداقلی برای اندازه‌گیری پینگ/جیتر.
 * عمداً کمترین کار ممکن را انجام می‌دهد تا زمان رفت‌وبرگشت، تأخیر شبکه را نشان بدهد نه پردازش سرور.
 */
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
http_response_code(204);
