<?php
declare(strict_types=1);
/** بخش تست وب‌کم */
?>
<section id="section-webcam" aria-labelledby="h-webcam">
  <h2 class="section-title" id="h-webcam">تست وب‌کم</h2>
  <p class="section-desc">وضوح، کیفیت تصویر و نورپردازی وب‌کم خود را پیش از تماس تصویری یا استریم بررسی کنید. تصویر فقط روی سیستم خودتان نمایش داده می‌شود و به هیچ سروری ارسال نمی‌شود.</p>

  <div class="grid">
    <article class="card card--wide">
      <h3>پیش‌نمایش زنده</h3>
      <div class="cam-frame" id="cam-frame">
        <span class="cam-placeholder" id="cam-placeholder">برای شروع، دکمه زیر را بزنید</span>
        <video id="cam-video" autoplay playsinline muted hidden></video>
        <img id="cam-photo-preview" alt="عکس گرفته‌شده" hidden>
      </div>
      <div class="btn-row btn-row--spaced">
        <button type="button" class="btn" id="cam-start">شروع وب‌کم</button>
        <button type="button" class="btn btn--secondary" id="cam-photo" disabled>گرفتن عکس</button>
        <button type="button" class="btn btn--secondary" id="cam-resume" hidden>بازگشت به تصویر زنده</button>
        <a class="btn btn--secondary" id="cam-download" download="webcam-test.png" hidden>ذخیره‌ی عکس</a>
        <button type="button" class="btn btn--secondary" id="cam-stop" disabled>توقف و آزادسازی وب‌کم</button>
      </div>
      <div class="stat"><span>وضوح جریان تصویر</span><output class="val num" id="cam-resolution">—</output></div>
      <div class="stat"><span>نرخ فریم</span><output class="val num" id="cam-fps">—</output></div>
      <div class="stat"><span>دستگاه</span><output class="val val--text" id="cam-device">—</output></div>
      <p class="live" id="cam-live" aria-live="polite">وب‌کم غیرفعال است</p>
    </article>
  </div>
</section>
