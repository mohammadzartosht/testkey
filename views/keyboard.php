<?php
declare(strict_types=1);
/** بخش تست کیبورد؛ خود صفحه‌کلید با جاوااسکریپت رسم می‌شود. */
?>
<section id="section-keyboard" aria-labelledby="h-keyboard">
  <h2 class="section-title" id="h-keyboard">تست صفحه‌کلید</h2>
  <p class="section-desc">اندازه کیبورد خود را انتخاب کنید و کلیدها را یکی‌یکی فشار دهید. کلیدهای فشرده‌شده سبز می‌شوند و کلیدهایی که هنوز تست نشده‌اند خاکستری باقی می‌مانند.</p>

  <div class="kb-panel">
    <div class="kb-tabs" role="group" aria-label="اندازه‌ی صفحه‌کلید">
      <button type="button" class="small-btn is-active" data-layout="full" aria-pressed="true">۱۰۰٪ کامل</button>
      <button type="button" class="small-btn" data-layout="tkl" aria-pressed="false">۸۰٪</button>
      <button type="button" class="small-btn" data-layout="seventyfive" aria-pressed="false">۷۵٪</button>
      <button type="button" class="small-btn" data-layout="sixty" aria-pressed="false">۶۰٪</button>
    </div>

    <div class="kb-stats">
      <span>کل کلیدها: <b class="num" id="kb-total">0</b></span>
      <span>تست‌شده: <b class="num" id="kb-tested">0</b></span>
      <span>باقی‌مانده: <b class="num" id="kb-remaining">0</b></span>
      <span>هم‌زمان فشرده: <b class="num" id="kb-concurrent">0</b></span>
      <span>بیشترین هم‌زمان: <b class="num" id="kb-max">0</b></span>
    </div>

    <div class="kb-viewport" id="kb-viewport">
      <div class="kb-board" id="kb-board" aria-hidden="true"></div>
    </div>

    <div class="kb-legend">
      <span><span class="sw sw--untested"></span>تست‌نشده</span>
      <span><span class="sw sw--tested"></span>تست‌شده</span>
      <span><span class="sw sw--now"></span>در حال فشردن</span>
    </div>

    <p class="kb-note">«بیشترین هم‌زمان» برای سنجش N-key rollover و ghosting مفید است: چند کلید را با هم نگه دارید و ببینید همه ثبت می‌شوند یا نه. کلید Fn در مرورگر قابل تشخیص نیست و در تست نیامده است.</p>

    <p class="status" id="status-kb" role="status"><span class="dot"></span><span class="status__text">در انتظار تست</span></p>
  </div>
</section>
