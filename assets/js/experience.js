/* Progressive enhancement: usable content and native media controls without JS. */
(() => {
  'use strict';
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 761px)');
  const rows = [...document.querySelectorAll('[data-story-row]')];
  const visible = new Set();
  let frame = 0;
  function paint() {
    frame = 0;
    if (motion.matches || !desktop.matches || document.hidden) return;
    visible.forEach(row => {
      const rect = row.getBoundingClientRect();
      const progress = Math.max(-1, Math.min(1, (rect.top + rect.height / 2 - innerHeight / 2) / innerHeight));
      row.style.setProperty('--story-shift', `${(progress * 32).toFixed(2)}px`);
    });
  }
  function schedule() { if (!frame && visible.size) frame = requestAnimationFrame(paint); }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) visible.add(target); else visible.delete(target);
      });
      schedule();
    }, { rootMargin: '100px' });
    rows.forEach(row => observer.observe(row));
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule, { passive: true });
  }
  function reset() { rows.forEach(row => row.style.removeProperty('--story-shift')); schedule(); }
  motion.addEventListener('change', reset);
  desktop.addEventListener('change', reset);
  document.addEventListener('visibilitychange', schedule);

  document.querySelectorAll('[data-reel-sound]').forEach(button => {
    const video = button.closest('.reel-phone').querySelector('video');
    const sync = () => {
      button.textContent = video.muted ? 'Ton an' : 'Ton aus';
      button.setAttribute('aria-pressed', String(!video.muted));
      button.setAttribute('aria-label', video.muted ? 'Reel-Ton einschalten' : 'Reel-Ton ausschalten');
    };
    button.addEventListener('click', () => { video.muted = !video.muted; });
    video.addEventListener('volumechange', sync);
    sync();
  });

  document.querySelectorAll('[data-reel-toggle]').forEach(button => {
    const video = button.closest('.reel-phone').querySelector('video');
    video.controls = false;
    const sync = () => {
      button.setAttribute('aria-pressed', String(!video.paused));
      button.setAttribute('aria-label', video.paused ? 'Reel abspielen' : 'Reel pausieren');
      button.querySelector('span').textContent = video.paused ? '▶' : 'Ⅱ';
    };
    button.addEventListener('click', () => {
      if (video.paused) video.play().catch(sync); else video.pause();
    });
    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);
    sync();
  });
})();
