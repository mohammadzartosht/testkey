<?php
declare(strict_types=1);
/** بخش تست دسته بازی؛ خانه‌های دکمه بر اساس تعداد دکمه‌های دسته با جاوااسکریپت ساخته می‌شوند. */
?>
<section id="section-gamepad" aria-labelledby="h-gamepad">
  <h2 class="section-title" id="h-gamepad">تست دسته بازی (گیم‌پد)</h2>
  <p class="section-desc">این ابزار همه‌ی دکمه‌ها، آنالوگ‌ها، تریگرها و لرزش دسته‌ی شما را بررسی می‌کند — از جمله تشخیص دریفت استیک، یکی از رایج‌ترین مشکلات دسته‌های بازی.</p>

  <div class="grid">

    <article class="card">
      <h3>وضعیت اتصال</h3>
      <p class="hint" id="gp-hint">برای فعال‌شدن، دسته را به سیستم وصل کنید و یک دکمه از آن را فشار دهید (این محدودیت خود مرورگرهاست).</p>
      <div class="stat"><span>وضعیت</span><output class="val" id="gp-status">متصل نیست</output></div>
      <div class="stat"><span>نام دسته</span><output class="val val--text" id="gp-name">—</output></div>
      <div class="stat"><span>تعداد دکمه</span><output class="val num" id="gp-buttons-count">—</output></div>
      <div class="stat"><span>تعداد آنالوگ</span><output class="val num" id="gp-axes-count">—</output></div>
      <div class="stat"><span>نگاشت (mapping)</span><output class="val num" id="gp-mapping">—</output></div>
    </article>

    <article class="card">
      <h3>دکمه‌ها</h3>
      <p class="desc">هر دکمه‌ای که فشار دهید، همان خانه روشن می‌شود.</p>
      <div class="gp-btn-grid" id="gp-btn-grid"></div>
    </article>

    <article class="card">
      <h3>تریگرها</h3>
      <p class="desc">میزان فشار تریگرهای چپ و راست (در صورت پشتیبانی آنالوگ).</p>
      <div class="gp-triggers">
        <div class="gp-trigger-row"><span>LT</span><div class="gp-trigger-bar"><div class="gp-trigger-fill" id="gp-lt-fill"></div></div><output class="val num" id="gp-lt-val">0٪</output></div>
        <div class="gp-trigger-row"><span>RT</span><div class="gp-trigger-bar"><div class="gp-trigger-fill" id="gp-rt-fill"></div></div><output class="val num" id="gp-rt-val">0٪</output></div>
      </div>
      <div class="btn-row btn-row--spaced">
        <button type="button" class="btn" id="gp-vibrate-btn">تست لرزش</button>
      </div>
    </article>

    <article class="card">
      <h3>آنالوگ‌ها و تشخیص دریفت</h3>
      <p class="desc">دسته را رها کنید و دکمه زیر را بزنید تا دریفت احتمالی استیک‌ها بررسی شود.</p>
      <div class="gp-sticks">
        <div>
          <div class="gp-stick-box"><div class="gp-stick-dot" id="gp-stick-l"></div></div>
          <div class="gp-stick-label">چپ (L)</div>
        </div>
        <div>
          <div class="gp-stick-box"><div class="gp-stick-dot" id="gp-stick-r"></div></div>
          <div class="gp-stick-label">راست (R)</div>
        </div>
      </div>
      <div class="btn-row btn-row--spaced">
        <button type="button" class="btn" id="gp-drift-check">بررسی دریفت (دسته را رها کنید)</button>
      </div>
      <p class="verdict-box" id="gp-drift-result" role="status">هنوز بررسی نشده است.</p>
    </article>

  </div>
</section>
