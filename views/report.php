<?php
declare(strict_types=1);
/** گزارش تشخیصی ماوس/کیبورد؛ ردیف‌ها را lib/report.js پر می‌کند. */
?>
<section class="report" id="section-report" aria-labelledby="h-report">
  <div class="report-ring-wrap">
    <div class="report-ring">
      <svg viewBox="0 0 96 96" aria-hidden="true">
        <circle class="ring-bg" cx="48" cy="48" r="40"></circle>
        <circle class="ring-fg" id="report-ring-fg" cx="48" cy="48" r="40"></circle>
      </svg>
      <div class="report-ring-num num" id="report-ring-num">0/0</div>
    </div>
    <span class="report-ring-caption">تست‌های موفق</span>
  </div>
  <div class="report-body">
    <h2 id="h-report">گزارش تشخیصی</h2>
    <p class="verdict" id="verdict" role="status">برای شروع، دکمه‌ها و کلیدها را امتحان کنید.</p>
    <div class="report-rows" id="report-rows"></div>
    <div class="report-actions">
      <button type="button" class="small-btn" id="btn-copy">کپی گزارش</button>
      <button type="button" class="small-btn" id="btn-reset">شروع دوباره</button>
    </div>
  </div>
</section>
