/* Progressive enhancement: usable content and native media controls without JS. */
(() => {
  'use strict';
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const story = document.querySelector('[data-story-scroll]');
  const stage = story?.querySelector('[data-story-stage]');
  const rows = story ? [...story.querySelectorAll('[data-story-row]')] : [];
  const links = story ? [...story.querySelectorAll('[data-story-go]')] : [];
  // Short windows retain the readable stacked layout. No wheel interception.
  const roomy = matchMedia('(min-height: 700px), (min-width: 761px) and (min-height: 600px)');
  let pinned = false;
  let target = 0;
  let progress = 0;
  let frame = 0;
  let lastTick = 0;
  let active = -1;
  let start = 0;
  let travel = 1;
  let onScreen = false;
  const clamp = n => Math.max(0, Math.min(1, n));
  const ease = n => n * n * (3 - 2 * n);

  function phaseAt(value) {
    const units = clamp(value) * rows.length;
    const index = Math.min(rows.length - 1, Math.floor(units));
    if (index === rows.length - 1) return index;
    return index + ease(clamp((units - index - .45) / .50));
  }

  function render() {
    const phase = phaseAt(progress);
    const current = Math.min(rows.length - 1, Math.round(phase));
    rows.forEach((row, index) => {
      const distance = index - phase;
      const weight = Math.max(0, 1 - Math.abs(distance));
      row.style.setProperty('--story-image-opacity', weight.toFixed(4));
      row.style.setProperty('--story-image-y', `${(distance * 22).toFixed(2)}px`);
      row.style.setProperty('--story-copy-y', `${(distance * Math.min(stage.clientHeight * .72, 640)).toFixed(2)}px`);
      row.style.setProperty('--story-copy-opacity', clamp(weight * 1.5).toFixed(4));
      row.style.zIndex = index === current ? '2' : '1';
      row.inert = index !== current;
      row.setAttribute('aria-hidden', String(index !== current));
    });
    stage.style.setProperty('--story-progress', progress.toFixed(5));
    if (current !== active) {
      active = current;
      story.dataset.storyIndex = String(current);
      const label = story.querySelector('[data-story-current]');
      if (label) label.textContent = String(current + 1).padStart(2, '0');
      links.forEach((link, index) => {
        if (index === current) link.setAttribute('aria-current', 'step');
        else link.removeAttribute('aria-current');
      });
    }
  }

  function tick(now) {
    frame = 0;
    if (!pinned || document.hidden) { lastTick = 0; return; }
    const elapsed = lastTick ? Math.min(now - lastTick, 50) : 16.67;
    lastTick = now;
    progress += (target - progress) * (1 - Math.exp(-elapsed / 110));
    if (Math.abs(progress - target) < .00008) progress = target;
    render();
    if (progress !== target) schedule(); else lastTick = 0;
  }

  function schedule() {
    if (!frame && pinned && onScreen && !document.hidden) frame = requestAnimationFrame(tick);
  }

  function measure() {
    if (!pinned) return;
    const rect = story.getBoundingClientRect();
    start = scrollY + rect.top;
    travel = Math.max(1, story.offsetHeight - stage.offsetHeight);
    target = clamp(-rect.top / travel);
    onScreen = rect.top < innerHeight && rect.bottom > 0;
    // A fast skip or anchor jump must leave the final scene resolved.
    if (!onScreen) { progress = target; lastTick = 0; render(); }
    schedule();
  }

  function configure() {
    if (!story || !stage || rows.length < 2) return;
    pinned = !motion.matches && roomy.matches;
    story.classList.toggle('is-pinned', pinned);
    story.style.setProperty('--story-count', rows.length);
    cancelAnimationFrame(frame); frame = 0; lastTick = 0; active = -1;
    if (pinned) {
      // Absolute layers do not trigger the usual below-the-fold lazy loading.
      rows.forEach(row => row.querySelectorAll('img').forEach(img => { img.loading = 'eager'; }));
      measure(); progress = target; render();
    } else {
      rows.forEach(row => {
        row.inert = false;
        row.removeAttribute('aria-hidden');
        row.style.removeProperty('--story-image-opacity');
        row.style.removeProperty('--story-image-y');
        row.style.removeProperty('--story-copy-y');
        row.style.removeProperty('--story-copy-opacity');
        row.style.removeProperty('z-index');
      });
      delete story.dataset.storyIndex;
    }
  }

  links.forEach((link, index) => link.addEventListener('click', event => {
    if (!pinned) return;
    event.preventDefault();
    measure();
    scrollTo({ top: start + travel * (index + .18) / rows.length, behavior: 'smooth' });
  }));
  addEventListener('scroll', measure, { passive: true });
  addEventListener('resize', measure, { passive: true });
  addEventListener('pageshow', measure);
  motion.addEventListener('change', configure);
  roomy.addEventListener('change', configure);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; lastTick = 0; }
    else measure();
  });
  if (story && 'ResizeObserver' in window) new ResizeObserver(measure).observe(story);
  configure();

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
