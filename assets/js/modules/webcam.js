/**
 * تست وب‌کم. تصویر هیچ‌جا ارسال نمی‌شود؛ همه‌چیز در همین صفحه می‌ماند.
 */
import { byId, mustId } from '../lib/dom.js';

export function initWebcam() {
  const startBtn = mustId('cam-start');
  const stopBtn = mustId('cam-stop');
  const photoBtn = mustId('cam-photo');
  const resumeBtn = mustId('cam-resume');
  const downloadLink = mustId('cam-download');
  const video = mustId('cam-video');
  const placeholder = mustId('cam-placeholder');
  const preview = mustId('cam-photo-preview');
  const live = mustId('cam-live');

  let stream = null;
  let photoUrl = null;

  const ui = {
    idle() {
      video.hidden = true;
      preview.hidden = true;
      placeholder.hidden = false;
      startBtn.disabled = false;
      photoBtn.disabled = true;
      stopBtn.disabled = true;
      resumeBtn.hidden = true;
      downloadLink.hidden = true;
      byId('cam-resolution').textContent = '—';
      byId('cam-fps').textContent = '—';
      byId('cam-device').textContent = '—';
      live.textContent = 'وب‌کم غیرفعال است';
    },
    streaming() {
      video.hidden = false;
      preview.hidden = true;
      placeholder.hidden = true;
      startBtn.disabled = true;
      photoBtn.disabled = false;
      stopBtn.disabled = false;
      resumeBtn.hidden = true;
      live.textContent = 'وب‌کم فعال است';
    },
    photo() {
      video.hidden = true;
      preview.hidden = false;
      photoBtn.disabled = true;
      resumeBtn.hidden = false;
      downloadLink.hidden = false;
      live.textContent = 'عکس گرفته شد — این عکس فقط روی دستگاه شما نمایش داده می‌شود.';
    },
  };

  function releasePhoto() {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = null;
  }

  startBtn.addEventListener('click', async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      live.textContent = 'مرورگر شما از دسترسی وب‌کم پشتیبانی نمی‌کند';
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    } catch {
      live.textContent = 'دسترسی به وب‌کم رد شد یا وب‌کمی پیدا نشد';
      return;
    }
    const track = stream.getVideoTracks()[0];
    track.addEventListener('ended', stop); // وقتی وب‌کم از سیستم جدا شود
    video.srcObject = stream;
    ui.streaming();

    const settings = track.getSettings?.() ?? {};
    byId('cam-device').textContent = track.label || 'وب‌کم پیش‌فرض';
    byId('cam-device').title = track.label;
    if (settings.frameRate) byId('cam-fps').textContent = `${Math.round(settings.frameRate)} fps`;
    video.addEventListener(
      'loadedmetadata',
      () => {
        byId('cam-resolution').textContent = `${video.videoWidth}×${video.videoHeight}`;
      },
      { once: true },
    );
  });

  photoBtn.addEventListener('click', () => {
    if (!video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    // پیش‌نمایش آینه‌ای است؛ عکس هم همان‌طور که می‌بینید ثبت می‌شود
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      releasePhoto();
      photoUrl = URL.createObjectURL(blob);
      preview.src = photoUrl;
      downloadLink.href = photoUrl;
      ui.photo();
    }, 'image/png');
  });

  resumeBtn.addEventListener('click', () => {
    releasePhoto();
    preview.removeAttribute('src');
    ui.streaming();
  });

  function stop() {
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    video.srcObject = null;
    releasePhoto();
    preview.removeAttribute('src');
    ui.idle();
  }
  stopBtn.addEventListener('click', stop);
  window.addEventListener('pagehide', stop);

  ui.idle();
}
