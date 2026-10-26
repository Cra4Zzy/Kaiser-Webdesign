/* Scroll film: native source frames, short H.264 keyframe intervals.
   One seek at a time; seeked immediately services the newest scroll position. */
(() => {
  'use strict';
  const section = document.querySelector('.hero-scroll');
  if (!section) return;
  const stage = section.querySelector('.hero-sticky');
  const video = section.querySelector('.hero-video');
  const chapter = section.querySelector('[data-hero-step]');
  if (!stage || !video || !chapter) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 900px)');
  const shortScreen = matchMedia('(max-width: 760px) and (max-height: 600px)');
  const saveData = Boolean(navigator.connection?.saveData);
  const FPS = 30;
  let enabled = !reduced.matches && !saveData;
  let ready = false;
  let failed = false;
  let loaded = false;
  let mobileSource = compact.matches;
  let visible = true;
  let target = 0;
  let position = 0;
  let end = 0;
  let raf = 0;
  let lastTick = 0;
  let requestedTime = -1;

  video.muted = true;
  video.playsInline = true;
  const clamp = n => Math.max(0, Math.min(1, n));
  const running = () => enabled && !failed && visible && !document.hidden;

  // Continuous, monotone timing: give the cube-to-website build more scroll
  // distance, without abrupt speed changes at a chapter boundary.
  const timeline = [
    { scroll: 0, film: 0, slope: 1.375 },
    { scroll: .16, film: .22, slope: 1.41 },
    { scroll: .36, film: .51, slope: 1.03 },
    { scroll: .92, film: .96, slope: .68 },
    { scroll: 1, film: 1, slope: 0 }
  ];
  function filmProgress(progress) {
    const p = clamp(progress);
    const index = timeline.findIndex(point => point.scroll >= p);
    if (index <= 0) return index === 0 ? 0 : 1;
    const a = timeline[index - 1], b = timeline[index];
    const span = b.scroll - a.scroll, t = (p - a.scroll) / span;
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * a.film + (t3 - 2 * t2 + t) * span * a.slope
      + (-2 * t3 + 3 * t2) * b.film + (t3 - t2) * span * b.slope;
  }

  function seek() {
    if (!running() || !ready || video.seeking) return;
    const time = Math.min(end, Math.round(filmProgress(position) * end * FPS) / FPS);
    // Seeking to the same time need not fire seeked, so never lock on it.
    if (Math.abs(time - video.currentTime) < 0.001 || time === requestedTime) return;
    requestedTime = time;
    try { video.currentTime = time; }
    catch { requestedTime = -1; }
  }

  function schedule() {
    if (!raf && running()) raf = requestAnimationFrame(tick);
  }

  function tick(now) {
    raf = 0;
    if (!running()) { lastTick = 0; return; }
    const elapsed = lastTick ? Math.min(now - lastTick, 50) : 16.67;
    lastTick = now;
    position += (target - position) * (1 - Math.exp(-elapsed / 170));
    if (Math.abs(target - position) < 0.00005) position = target;
    stage.style.setProperty('--hero-progress', position);
    const film = filmProgress(position);
    chapter.textContent = film < .30 ? '01 / DEINE MARKE' : film < .72 ? '02 / ALLES GREIFT INEINANDER' : '03 / DEIN DIGITALER AUFTRITT';
    seek();
    if (position !== target) schedule();
    else lastTick = 0;
  }

  function measure() {
    const rect = section.getBoundingClientRect();
    visible = rect.bottom > 0 && rect.top < innerHeight;
    const travel = section.offsetHeight - stage.offsetHeight;
    target = travel > 1 ? clamp(-rect.top / travel) : 0;
    // The final frame is also resolved when a quick scroll leaves the hero.
    if (!visible) { position = target; lastTick = 0; }
    schedule();
  }

  function load() {
    if (loaded || !enabled || shortScreen.matches) return;
    loaded = true;
    video.preload = 'auto';
    video.src = `assets/video/kaiser-scroll-${mobileSource ? 'mobile' : 'desktop'}.mp4?v=20261026-clean-6`;
    video.load();
  }

  function sync() {
    section.classList.toggle('is-scrubbing', enabled && !failed && !shortScreen.matches);
    section.classList.toggle('has-video', enabled && ready && !failed);
    if (!running()) { cancelAnimationFrame(raf); raf = 0; lastTick = 0; }
    load();
    measure();
  }

  video.addEventListener('loadedmetadata', () => {
    end = Math.max(0, video.duration - 1 / FPS);
    requestedTime = -1;
  });
  video.addEventListener('loadeddata', () => { ready = true; sync(); });
  video.addEventListener('seeked', () => {
    requestedTime = -1;
    seek();
  });
  video.addEventListener('error', () => {
    // Devices without a 4K decoder can still use the Full-HD film.
    if (!mobileSource) {
      mobileSource = true; loaded = false; ready = false; requestedTime = -1;
      section.classList.remove('has-video'); load();
    } else {
      failed = true; ready = false; sync(); // Keep the sharp poster, no fake motion.
    }
  });
  reduced.addEventListener('change', () => {
    enabled = !reduced.matches && !saveData; sync();
  });
  shortScreen.addEventListener('change', sync);
  addEventListener('scroll', measure, { passive: true });
  addEventListener('resize', () => { measure(); }, { passive: true });
  addEventListener('pageshow', measure);
  document.addEventListener('visibilitychange', () => {
    lastTick = 0;
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
    else measure();
  });
  if ('ResizeObserver' in window) {
    new ResizeObserver(measure).observe(stage);
  }
  sync();
})();
