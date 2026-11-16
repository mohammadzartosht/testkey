<?php
declare(strict_types=1);
/** بخش تست ماوس: تصویر ماوس + دکمه‌ها + دبل‌کلیک + اسکرول */
?>
<section id="section-mouse" aria-label="تست ماوس">
  <div class="mouse-stage">
    <svg class="mouse" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="تصویر ماوس؛ دکمه‌ای که فشار می‌دهید روشن می‌شود">
      <rect class="mouse-body" x="35" y="15" width="130" height="270" rx="65"></rect>
      <rect id="svg-left"   class="mouse-part" x="38"  y="18" width="60" height="95" rx="28"></rect>
      <rect id="svg-right"  class="mouse-part" x="102" y="18" width="60" height="95" rx="28"></rect>
      <rect id="svg-middle" class="mouse-part" x="91"  y="28" width="18" height="45" rx="9"></rect>
      <rect id="svg-forward" class="mouse-part" x="26" y="92"  width="10" height="26" rx="4"></rect>
      <rect id="svg-back"    class="mouse-part" x="26" y="124" width="10" height="26" rx="4"></rect>
    </svg>

    <div class="legend" aria-hidden="true">
      <span class="chip" id="chip-left">کلیک چپ</span>
      <span class="chip" id="chip-right">کلیک راست</span>
      <span class="chip" id="chip-middle">کلیک وسط</span>
      <span class="chip chip--optional" id="chip-back">دکمه کناری ۱</span>
      <span class="chip chip--optional" id="chip-forward">دکمه کناری ۲</span>
    </div>
  </div>

  <div class="grid">

    <article class="card">
      <h3>دکمه‌های اصلی</h3>
      <p class="desc">در هر جای صفحه با هر دکمه کلیک کنید. دکمه‌های کناری (در صورت وجود) اختیاری‌اند.</p>
      <div class="stat"><span>کلیک چپ</span><output class="val num" id="cnt-left">0</output></div>
      <div class="stat"><span>کلیک راست</span><output class="val num" id="cnt-right">0</output></div>
      <div class="stat"><span>کلیک وسط</span><output class="val num" id="cnt-middle">0</output></div>
      <div class="stat"><span>دکمه کناری ۱ / ۲</span><output class="val num" id="cnt-side">0 / 0</output></div>
      <p class="status" id="status-buttons" role="status"><span class="dot"></span><span class="status__text">در انتظار تست</span></p>
    </article>

    <article class="card">
      <h3>دبل‌کلیک و پایداری کلیک</h3>
      <p class="desc">چند بار کلیک تکی و چند بار دبل‌کلیک روی دکمه زیر بزنید.</p>
      <button type="button" class="target-btn" id="dbl-target">اینجا کلیک کنید</button>
      <div class="stat"><span>کلیک‌های ثبت‌شده</span><output class="val num" id="dbl-clicks">0</output></div>
      <div class="stat"><span>دبل‌کلیک ثبت‌شده</span><output class="val num" id="dbl-count">0</output></div>
      <div class="stat"><span>کوتاه‌ترین فاصله</span><output class="val num" id="dbl-gap">—</output></div>
      <p class="status" id="status-dbl" role="status"><span class="dot"></span><span class="status__text">در انتظار تست</span></p>
    </article>

    <article class="card">
      <h3>چرخ اسکرول</h3>
      <p class="desc">نشانگر ماوس را روی کادر زیر ببرید و به بالا و پایین اسکرول کنید.</p>
      <div class="scroll-zone" id="scroll-zone" tabindex="0" aria-label="ناحیه‌ی تست چرخ اسکرول">
        <div class="scroll-arrows" aria-hidden="true">
          <span id="arrow-up">▲</span>
          <span id="arrow-down">▼</span>
        </div>
        <div class="scroll-track" aria-hidden="true"><div class="scroll-dot" id="scroll-dot"></div></div>
      </div>
      <p class="lock-note" id="lock-note"><span class="lock-dot" aria-hidden="true"></span><span id="lock-note-text">اسکرول صفحه فعال است</span></p>
      <div class="stat"><span>اسکرول به بالا</span><output class="val num" id="cnt-up">0</output></div>
      <div class="stat"><span>اسکرول به پایین</span><output class="val num" id="cnt-down">0</output></div>
      <p class="status" id="status-scroll" role="status"><span class="dot"></span><span class="status__text">در انتظار تست</span></p>
    </article>

  </div>
</section>
