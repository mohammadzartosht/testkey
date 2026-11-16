<?php
declare(strict_types=1);
/** بخش تست سرعت و کیفیت اینترنت؛ گیج‌ها با جاوااسکریپت (lib/gauge.js) داخل [data-gauge] ساخته می‌شوند. */
?>
<section id="section-network" aria-labelledby="h-network">
  <h2 class="section-title" id="h-network">تست سرعت و کیفیت اینترنت</h2>
  <p class="section-desc">این تست مستقیم با سرور همین سایت انجام می‌شود، نه یک سرویس واسط خارجی — نتیجه واقعی‌تری از کیفیت اتصال شما به این سرور به‌دست می‌دهد. برای گیمرها، پینگ و جیتر معمولاً از سرعت خام دانلود مهم‌ترند.</p>
  <p class="net-note">توجه: این تست‌ها نسبت به سروری داخل کشور انجام می‌شوند. بسته به نوع اینترنت شما (بین‌الملل/داخلی)، پینگ و سرعت به سرورهای خارجی معمولاً بالاتر و کندتر از نتیجه‌ی این صفحه است.</p>

  <div class="grid">

    <article class="card card--stack">
      <h3>پینگ و جیتر</h3>
      <p class="desc">۱۵ بسته‌ی کوچک به سرور فرستاده می‌شود تا میانگین تأخیر، نوسان تأخیر (جیتر) و درصد بسته‌های ازدست‌رفته اندازه‌گیری شود.</p>
      <div class="btn-row"><button type="button" class="btn" id="net-ping-start">شروع تست پینگ</button></div>
      <div class="gauge" data-gauge="ping" data-max="200" data-scale="linear" data-low-is-good="true" data-unit="ms" data-end-label="200ms"></div>
      <div class="net-sub-stats">
        <div class="stat"><span>میانگین</span><output class="val num" id="net-ping-avg">—</output></div>
        <div class="stat"><span>جیتر</span><output class="val num" id="net-ping-jitter">—</output></div>
        <div class="stat"><span>کمترین</span><output class="val num" id="net-ping-min">—</output></div>
        <div class="stat"><span>بیشترین</span><output class="val num" id="net-ping-max">—</output></div>
        <div class="stat"><span>بسته ازدست‌رفته</span><output class="val num" id="net-ping-loss">—</output></div>
      </div>
      <p class="verdict-box" id="net-ping-verdict" role="status">برای شروع، دکمه بالا را بزنید.</p>
    </article>

    <article class="card card--stack">
      <h3>سرعت دانلود</h3>
      <p class="desc">چند فایل آزمایشی هم‌زمان از سرور دانلود می‌شود (حدود ۶ ثانیه) و سرعت لحظه‌ای و نهایی نمایش داده می‌شود.</p>
      <div class="btn-row"><button type="button" class="btn" id="net-dl-start">شروع تست دانلود</button></div>
      <div class="gauge" data-gauge="dl" data-min="1" data-max="300" data-scale="log" data-unit="Mbps" data-end-label="300+"></div>
      <p class="verdict-box" id="net-dl-verdict" role="status">برای شروع، دکمه بالا را بزنید.</p>
    </article>

    <article class="card card--stack">
      <h3>سرعت آپلود</h3>
      <p class="desc">داده‌ی تصادفی به‌صورت هم‌زمان به سرور ارسال می‌شود (حدود ۶ ثانیه) و سرعت لحظه‌ای و نهایی آپلود نمایش داده می‌شود.</p>
      <div class="btn-row"><button type="button" class="btn" id="net-ul-start">شروع تست آپلود</button></div>
      <div class="gauge" data-gauge="ul" data-min="1" data-max="100" data-scale="log" data-unit="Mbps" data-end-label="100+"></div>
      <p class="verdict-box" id="net-ul-verdict" role="status">برای شروع، دکمه بالا را بزنید.</p>
    </article>

    <article class="card card--stack">
      <h3>جمع‌بندی برای گیمینگ</h3>
      <p class="desc">پس از اجرای تست پینگ، دانلود و آپلود، جمع‌بندی مناسب بودن اتصال شما برای بازی آنلاین اینجا نمایش داده می‌شود.</p>
      <div class="btn-row">
        <button type="button" class="btn" id="net-run-all">اجرای هر سه تست پشت‌سرهم</button>
        <button type="button" class="btn btn--secondary" id="net-stop" disabled>توقف</button>
      </div>
      <p class="verdict-box" id="net-overall-verdict" role="status">هنوز هیچ تستی اجرا نشده است.</p>
    </article>

  </div>
</section>
