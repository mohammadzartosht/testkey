<?php
declare(strict_types=1);
/** پرسش‌های متداول — از content/faq.php خوانده می‌شود (همان داده در JSON-LD هم استفاده شده است). */
?>
<section aria-labelledby="h-faq">
  <h2 class="section-title" id="h-faq">سوالات متداول</h2>
  <div class="faq-list">
    <?php foreach ($faq as $item): ?>
      <details class="faq-item">
        <summary><?= e($item['q']) ?></summary>
        <p><?= e($item['a']) ?></p>
      </details>
    <?php endforeach; ?>
  </div>
</section>
