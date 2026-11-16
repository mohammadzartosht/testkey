<?php
declare(strict_types=1);
/** فرم نظرات؛ ارسال با modules/feedback.js به api/feedback.php انجام می‌شود. */
?>
<section id="section-feedback" aria-labelledby="h-feedback">
  <h2 class="section-title" id="h-feedback">نظر شما درباره این ابزار</h2>
  <p class="section-desc">اگر مشکلی دیدید، پیشنهادی داشتید یا نتیجه‌ی تستی برایتان عجیب بود، از همین‌جا برای ما بنویسید. پیام شما مستقیم به تیم <?= e($config['site_name']) ?> ارسال می‌شود.</p>

  <div class="prose-card">
    <form class="feedback-form" id="feedback-form" action="api/feedback.php" method="post" novalidate>
      <input type="text" name="website" class="feedback-hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="field">
        <label for="fb-name">نام (اختیاری)</label>
        <input type="text" id="fb-name" name="name" maxlength="80" autocomplete="name">
      </div>
      <div class="field">
        <label for="fb-email">ایمیل (اختیاری، برای پاسخ)</label>
        <input type="email" id="fb-email" name="email" maxlength="120" autocomplete="email" dir="ltr">
      </div>
      <div class="field">
        <label for="fb-message">پیام شما *</label>
        <textarea id="fb-message" name="message" required maxlength="4000"></textarea>
        <span class="field__count num" id="fb-count" aria-hidden="true">0 / 4000</span>
      </div>
      <div class="btn-row">
        <button type="submit" class="btn" id="fb-submit">ارسال نظر</button>
      </div>
      <p class="feedback-status" id="fb-status" role="status" aria-live="polite">&nbsp;</p>
    </form>
  </div>
</section>
