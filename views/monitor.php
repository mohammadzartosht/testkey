<?php
declare(strict_types=1);

/** بخش تست مانیتور: اطلاعات نمایشگر + پنج تست تمام‌صفحه */
$monitorTests = [
    ['deadpixel',  'پیکسل مرده و رنگ یکدست', 'رنگ‌های تخت مشکی، سفید، قرمز، سبز، آبی و چند رنگ دیگر را به‌ترتیب نمایش می‌دهد. دنبال نقطه‌ای با رنگ ثابت و متفاوت (پیکسل مرده یا سوخته) بگردید.'],
    ['gradient',   'گرادیان رنگ و بندینگ', 'گرادیان‌های قرمز، سبز، آبی و خاکستری را بررسی می‌کند تا نوارهای ناخواسته در تغییر رنگ (بندینگ) مشخص شود.'],
    ['contrast',   'کنتراست سیاه و سفید', 'پله‌های نزدیک به سیاه و نزدیک به سفید را نشان می‌دهد تا مشخص شود مانیتور چند سطح تیرگی/روشنی نزدیک به هم را واقعاً تفکیک می‌کند.'],
    ['sharpness',  'وضوح و تیزی تصویر', 'الگوی خطوط باریک و متن نمونه برای بررسی تاری، موآره یا مشکلات مقیاس‌بندی تصویر روی رزولوشن غیر بومی.'],
    ['uniformity', 'یکنواختی نور پس‌زمینه', 'چند سطح خاکستری یکدست را نمایش می‌دهد. بهتر است در اتاق نسبتاً تاریک اجرا شود تا نشتی نور یا لکه‌های روشن مشخص شوند.'],
];
?>
<section id="section-monitor" aria-labelledby="h-monitor">
  <h2 class="section-title" id="h-monitor">تست مانیتور</h2>
  <p class="section-desc">هر تست را به‌صورت تمام‌صفحه اجرا کنید و با چشم خودتان تصویر را بررسی کنید — این نوع تست‌ها نیاز به بازرسی بصری دارند و به‌طور خودکار قابل تشخیص نیستند. برای رفتن به مرحله‌ی بعد کلیک یا کلید فاصله و برای بستن، کلید Esc یا دکمه بستن را بزنید.</p>

  <div class="grid">
    <article class="card">
      <h3>اطلاعات نمایشگر</h3>
      <p class="desc">اطلاعات فنی نمایشگر فعلی شما.</p>
      <div class="stat"><span>وضوح صفحه (CSS)</span><output class="val num" id="mon-resolution">—</output></div>
      <div class="stat"><span>وضوح فیزیکی تقریبی</span><output class="val num" id="mon-physical">—</output></div>
      <div class="stat"><span>نسبت پیکسل</span><output class="val num" id="mon-dpr">—</output></div>
      <div class="stat"><span>نرخ تازه‌سازی تقریبی</span><output class="val num" id="mon-refresh">—</output></div>
      <div class="stat"><span>پشتیبانی رنگ گسترده</span><output class="val num" id="mon-gamut">—</output></div>
      <div class="stat"><span>پشتیبانی HDR</span><output class="val num" id="mon-hdr">—</output></div>
    </article>

    <?php foreach ($monitorTests as [$id, $title, $desc]): ?>
      <article class="card card--action">
        <h3><?= e($title) ?></h3>
        <p class="desc"><?= e($desc) ?></p>
        <button type="button" class="btn" data-test="<?= e($id) ?>">شروع تست تمام‌صفحه</button>
      </article>
    <?php endforeach; ?>
  </div>
</section>
