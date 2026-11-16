<?php
declare(strict_types=1);

/**
 * بخش تست صدا. مختصات و زاویه‌ی هر بلندگو فقط همین‌جا تعریف می‌شود؛
 * جاوااسکریپت زاویه و نام را از data-attributeهای همین عناصر می‌خواند.
 * زاویه: ۰ = روبه‌رو، ۹۰ = راست، ۱۸۰ = پشت، ۲۷۰ = چپ.
 */
$speakers = [
    'fl' => ['angle' => 315, 'name' => 'جلو-چپ (FL)',   'short' => 'FL'],
    'c'  => ['angle' => 0,   'name' => 'وسط (C)',        'short' => 'C'],
    'fr' => ['angle' => 45,  'name' => 'جلو-راست (FR)',  'short' => 'FR'],
    'sr' => ['angle' => 90,  'name' => 'کنار-راست (SR)', 'short' => 'SR'],
    'rr' => ['angle' => 135, 'name' => 'پشت-راست (RR)',  'short' => 'RR'],
    'rl' => ['angle' => 225, 'name' => 'پشت-چپ (RL)',    'short' => 'RL'],
    'sl' => ['angle' => 270, 'name' => 'کنار-چپ (SL)',   'short' => 'SL'],
];
$cx = 75; $cy = 75; $radius = 58;
?>
<section id="section-audio" aria-labelledby="h-audio">
  <h2 class="section-title" id="h-audio">تست صدای هدست و میکروفن</h2>
  <p class="section-desc">در این بخش از هدفون یا هدست استفاده کنید تا نتیجه دقیق باشد. صداها به‌صورت زنده در مرورگر ساخته می‌شوند؛ برای تست ۷.۱ و صدای سه‌بعدی از پردازش دوگوشی (HRTF) روی هدست استریوی شما استفاده می‌شود.</p>

  <div class="grid">

    <article class="card">
      <h3>اطلاعات خروجی صدا</h3>
      <p class="desc">اطلاعات فنی سیستم صوتی فعلی شما (پس از اولین تعامل با صفحه نمایش داده می‌شود).</p>
      <div class="stat"><span>نرخ نمونه‌برداری</span><output class="val num" id="aud-samplerate">—</output></div>
      <div class="stat"><span>حداکثر کانال خروجی</span><output class="val num" id="aud-maxchannels">—</output></div>
      <div class="stat"><span>وضعیت میکروفن</span><output class="val" id="aud-micstate">آماده</output></div>
    </article>

    <article class="card card--stack">
      <h3>تست کانال چپ و راست</h3>
      <p class="desc">هر دکمه را جداگانه بزنید و مطمئن شوید صدا فقط از همان طرف پخش می‌شود.</p>
      <div class="btn-row">
        <button type="button" class="btn" data-chan="left">فقط چپ</button>
        <button type="button" class="btn" data-chan="right">فقط راست</button>
        <button type="button" class="btn btn--secondary" data-chan="both">هر دو</button>
      </div>
      <p class="live" id="aud-live-lr" aria-live="polite">&nbsp;</p>
    </article>

    <article class="card card--stack">
      <h3>تست صدای ۷.۱ کاناله</h3>
      <p class="desc">روی هدست استریو، هر یک از ۸ جهت استاندارد ۷.۱ به‌صورت شبیه‌سازی‌شده (HRTF) پخش می‌شود.</p>
      <div class="aud-compass">
        <svg viewBox="0 0 150 150" role="img" aria-label="نقشه‌ی جهت بلندگوها نسبت به سر شنونده">
          <circle class="ring" cx="<?= $cx ?>" cy="<?= $cy ?>" r="<?= $radius ?>"></circle>
          <ellipse class="head" cx="<?= $cx ?>" cy="<?= $cy ?>" rx="14" ry="18"></ellipse>
          <?php foreach ($speakers as $id => $s):
              $rad = deg2rad($s['angle']);
              $x = round($cx + $radius * sin($rad), 1);
              $y = round($cy - $radius * cos($rad), 1);
              $labelY = cos($rad) > 0.1 ? $y - 10 : $y + 19;
          ?>
            <circle class="aud-dot" id="aud-dot-<?= $id ?>" cx="<?= $x ?>" cy="<?= $y ?>" r="7"
                    data-speaker="<?= $id ?>" data-angle="<?= $s['angle'] ?>" data-label="<?= e($s['name']) ?>"></circle>
            <text class="aud-dot-label" x="<?= $x ?>" y="<?= $labelY ?>"><?= $s['short'] ?></text>
          <?php endforeach; ?>
        </svg>
      </div>
      <p class="lfe"><span class="lfe-dot" id="aud-lfe-dot" aria-hidden="true"></span>LFE / ساب‌ووفر</p>
      <div class="btn-row">
        <button type="button" class="btn" id="aud-71-start">شروع توالی ۸ جهت</button>
        <button type="button" class="btn btn--secondary" id="aud-71-stop" disabled>توقف</button>
      </div>
      <p class="live" id="aud-live-71" aria-live="polite">&nbsp;</p>
    </article>

    <article class="card card--stack">
      <h3>تست صدای سه‌بعدی</h3>
      <p class="desc">یک صدا به‌صورت پیوسته دور سر شما می‌چرخد تا حس فضایی (۳بعدی) هدست را بررسی کنید.</p>
      <div class="btn-row">
        <button type="button" class="btn" id="aud-3d-start">شروع چرخش</button>
        <button type="button" class="btn btn--secondary" id="aud-3d-stop" disabled>توقف</button>
      </div>
      <p class="live" id="aud-live-3d" aria-live="polite">&nbsp;</p>
    </article>

    <article class="card card--stack">
      <h3>شبیه‌ساز صدای پا (شوتر)</h3>
      <p class="desc">صدای قدم را از یک جهت تصادفی یا در حال رد شدن از کنار شما پخش می‌کند — مناسب تمرین تشخیص جهت صدا در بازی‌های شوتر.</p>
      <div class="btn-row">
        <button type="button" class="btn" id="aud-step-random">یک قدم از جهت تصادفی</button>
        <button type="button" class="btn btn--secondary" id="aud-step-passby">رد شدن از کنار</button>
      </div>
      <p class="live" id="aud-live-step" aria-live="polite">&nbsp;</p>
    </article>

    <article class="card card--stack">
      <h3>تست میکروفن</h3>
      <p class="desc">با اجازه‌ی شما به میکروفن دسترسی می‌گیرد، سطح صدای ورودی را نشان می‌دهد، و می‌توانید صدای خودتان را ضبط و پخش کنید. برای جلوگیری از پس‌خوراند (فیدبک) از هدفون استفاده کنید.</p>
      <div class="btn-row">
        <button type="button" class="btn" id="aud-mic-start">شروع تست میکروفن</button>
        <button type="button" class="btn btn--secondary" id="aud-mic-record" disabled>ضبط ۳ ثانیه و پخش</button>
        <button type="button" class="btn btn--secondary" id="aud-mic-stop" disabled>توقف و آزادسازی میکروفن</button>
      </div>
      <div class="meter" id="aud-meter" role="meter" aria-label="سطح صدای میکروفن" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></div>
      <div class="stat"><span>دستگاه</span><output class="val val--text" id="aud-mic-device">—</output></div>
      <p class="live" id="aud-live-mic" aria-live="polite">میکروفن غیرفعال است</p>
    </article>

  </div>
</section>
