/* ==========================================================
   Kaiser-Webdesign · Performance-safe interaction layer
   V42: Desktop flüssig halten + Mobile Safari Scroll-Hero wieder robust entsperren.
   ========================================================== */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const media = {
  mobileLike: window.matchMedia('(max-width: 900px), (pointer: coarse)'),
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)')
};

let isMobileLike = media.mobileLike.matches;
let reduceMotion = media.reducedMotion.matches;
let viewportHeight = window.innerHeight;

const refreshViewport = () => {
  viewportHeight = window.innerHeight || document.documentElement.clientHeight || 800;
  isMobileLike = media.mobileLike.matches;
  reduceMotion = media.reducedMotion.matches;
};

/* Loader */
document.body.classList.add('lock');
window.addEventListener('load', () => {
  window.setTimeout(() => {
    $('.loader')?.classList.add('hide');
    document.body.classList.remove('lock');
  }, 650);
});

/* Smooth anchors */
$$('a[href^="#"]').forEach(link => {
  link.addEventListener('click', event => {
    const id = link.getAttribute('href')?.slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start'
    });
  });
});

function setupVideo(video) {
  if (!video) return;

  // Wichtig für iOS/Safari: Attribute nicht nur im HTML, sondern auch per JS setzen.
  // Sonst blockiert Safari teilweise das spätere currentTime-Scrubbing.
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.setAttribute('preload', 'auto');

  try { video.load(); } catch (error) {}

  const primeVideo = () => {
    try {
      if (video.readyState > 0 && video.currentTime < 0.04) video.currentTime = 0.04;
    } catch (error) {}
  };

  const unlock = () => {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const promise = video.play();
    if (promise && typeof promise.then === 'function') {
      promise
        .then(() => {
          try { video.pause(); } catch (error) {}
          primeVideo();
        })
        .catch(primeVideo);
    } else {
      primeVideo();
    }
  };

  // touchmove/click zusätzlich zu touchstart: iOS Safari entsperrt Media manchmal erst
  // bei echter Nutzerinteraktion während des Scrollens.
  ['touchstart', 'touchmove', 'pointerdown', 'click'].forEach(eventName => {
    window.addEventListener(eventName, unlock, { passive: true, once: true });
  });
}

function setProgressBar(bar, progressValue) {
  if (!bar) return;
  bar.style.transform = `scaleX(${clamp(progressValue, 0, 1)})`;
}

function createScrollFilm({
  sectionSelector,
  videoSelector,
  progressSelector,
  copySelector,
  buttonSelector,
  steps,
  smooth = 0.16
}) {
  const section = $(sectionSelector);
  const video = $(videoSelector);
  const progress = $(progressSelector);
  const copies = $$(copySelector);
  const buttons = $$(buttonSelector);

  if (!section || !video) {
    return { measure() {}, update() { return false; }, force() {} };
  }

  setupVideo(video);

  let duration = 8;
  let ready = false;
  let sectionTop = 0;
  let sectionHeight = 1;
  let scrollable = 1;
  let activeStep = -1;
  let lastProgress = -1;
  let targetTime = 0;
  let currentTime = 0;
  let lastVideoSet = -1;

  const measure = () => {
    const rect = section.getBoundingClientRect();
    sectionTop = rect.top + window.scrollY;
    sectionHeight = Math.max(1, section.offsetHeight || rect.height || 1);
    scrollable = Math.max(1, sectionHeight - viewportHeight);
  };

  const setStep = step => {
    if (step === activeStep) return;
    activeStep = step;

    copies.forEach((element, index) => element.classList.toggle('active', index === step));
    buttons.forEach((element, index) => element.classList.toggle('active', index === step));
  };

  const setVideoTime = (time, force = false) => {
    if (!ready || isMobileLike || reduceMotion) return;

    const safeTime = clamp(time, 0.02, Math.max(duration - 0.08, 0.1));
    const diffFromVideo = Math.abs(video.currentTime - safeTime);
    const diffFromLastSet = Math.abs(lastVideoSet - safeTime);

    // Desktop-Fix: currentTime nicht bei jedem Mikro-Scroll neu setzen.
    // Video-Seeking ist der teuerste Teil der Sequenz.
    if (force || diffFromVideo > 0.06 || diffFromLastSet > 0.08) {
      try {
        video.currentTime = safeTime;
        lastVideoSet = safeTime;
      } catch (error) {}
    }
  };

  const update = (force = false) => {
    if (reduceMotion) return false;

    const rectTop = sectionTop - window.scrollY;
    const isRelevant = rectTop < viewportHeight * 1.15 && rectTop > -sectionHeight - viewportHeight * 0.15;
    if (!isRelevant && !force) return false;

    const progressValue = clamp(-rectTop / scrollable, 0, 1);

    if (force || Math.abs(progressValue - lastProgress) > 0.0015) {
      lastProgress = progressValue;
      setProgressBar(progress, progressValue);

      const step = clamp(Math.floor(progressValue * steps), 0, steps - 1);
      setStep(step);
    }

    if (!isMobileLike && ready) {
      targetTime = progressValue * Math.max(duration - 0.08, 0.1);
      currentTime += (targetTime - currentTime) * (force ? 1 : smooth);
      setVideoTime(currentTime, force);

      return Math.abs(targetTime - currentTime) > 0.018;
    }

    return false;
  };

  video.addEventListener('loadedmetadata', () => {
    duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : duration;
    ready = true;
    measure();
    update(true);
  }, { passive: true });

  video.addEventListener('canplay', () => {
    section.classList.add('video-ready');
    update(true);
  }, { passive: true });

  video.addEventListener('error', () => {
    console.error('Video konnte nicht geladen werden:', video.getAttribute('src'));
  });

  buttons.forEach((button, index) => {
    button.addEventListener('click', () => {
      measure();
      const top = sectionTop + (index / Math.max(steps - 1, 1)) * scrollable;
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  measure();
  setStep(0);

  return {
    measure,
    update,
    force() {
      measure();
      update(true);
    }
  };
}

function createReferenceShowcase() {
  const section = $('#references');
  const progress = section ? $('.refs-progress i', section) : null;
  const texts = section ? $$('.refs-text', section) : [];
  const cards = section ? $$('.refs-card', section) : [];
  const buttons = section ? $$('.refs-tabs button', section) : [];

  if (!section || !texts.length || !cards.length) {
    return { measure() {}, update() { return false; }, force() {} };
  }

  let sectionTop = 0;
  let sectionHeight = 1;
  let scrollable = 1;
  let activeStep = -1;
  let lastProgress = -1;

  const measure = () => {
    const rect = section.getBoundingClientRect();
    sectionTop = rect.top + window.scrollY;
    sectionHeight = Math.max(1, section.offsetHeight || rect.height || 1);
    scrollable = Math.max(1, sectionHeight - viewportHeight);
  };

  const setStep = step => {
    if (step === activeStep) return;
    activeStep = step;

    texts.forEach((element, index) => element.classList.toggle('active', index === step));
    cards.forEach((element, index) => element.classList.toggle('active', index === step));
    buttons.forEach((element, index) => element.classList.toggle('active', index === step));
  };

  const update = (force = false) => {
    if (isMobileLike && window.innerWidth <= 820) return false;

    const rectTop = sectionTop - window.scrollY;
    const isRelevant = rectTop < viewportHeight * 1.15 && rectTop > -sectionHeight - viewportHeight * 0.15;
    if (!isRelevant && !force) return false;

    const progressValue = clamp(-rectTop / scrollable, 0, 1);
    if (!force && Math.abs(progressValue - lastProgress) < 0.0015) return false;

    lastProgress = progressValue;
    setProgressBar(progress, progressValue);

    const step = clamp(Math.floor(progressValue * texts.length), 0, texts.length - 1);
    setStep(step);

    return false;
  };

  buttons.forEach((button, index) => {
    button.addEventListener('click', () => {
      measure();
      const top = sectionTop + (index / Math.max(texts.length - 1, 1)) * scrollable;
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  measure();
  setStep(0);

  return {
    measure,
    update,
    force() {
      measure();
      update(true);
    }
  };
}

function createParallaxController() {
  const images = $$('.section-bg img');
  if (!images.length) return { measure() {}, update() { return false; }, force() {} };

  const update = () => {
    if (isMobileLike || reduceMotion) return false;

    images.forEach(image => {
      const section = image.closest('section');
      if (!section) return;

      const rect = section.getBoundingClientRect();
      if (rect.bottom < -120 || rect.top > viewportHeight + 120) return;

      const progressValue = clamp((viewportHeight * 0.5 - rect.top) / viewportHeight, -1, 1);
      image.style.setProperty('--parallax', `${progressValue * 12}px`);
    });

    return false;
  };

  return { measure() {}, update, force: update };
}

function setupMobileVideoScrubbing(sectionSelector, videoSelector) {
  const section = $(sectionSelector);
  const video = $(videoSelector);
  if (!section || !video) return { update() {}, measure() {} };

  let sectionTop = 0;
  let sectionHeight = 1;
  let scrollable = 1;
  let localRaf = 0;

  const measure = () => {
    const rect = section.getBoundingClientRect();
    sectionTop = rect.top + window.scrollY;
    sectionHeight = Math.max(1, section.offsetHeight || rect.height || 1);
    scrollable = Math.max(1, sectionHeight - viewportHeight);
  };

  const update = (force = false) => {
    if (!isMobileLike || reduceMotion) return;

    const rectTop = sectionTop - window.scrollY;
    const isRelevant = rectTop < viewportHeight * 1.12 && rectTop > -sectionHeight - viewportHeight * 0.12;
    if (!isRelevant && !force) return;

    const progressValue = clamp(-rectTop / scrollable, 0, 1);
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 8;
    const maxTime = Math.max(duration - 0.08, 0.1);
    const targetTime = clamp(progressValue * maxTime, 0.02, maxTime);

    if (video.readyState > 0) {
      try {
        // Auf Mobile Safari bewusst direkter setzen als Desktop.
        // iOS nimmt currentTime-Updates sonst oft erst nach mehreren Scroll-Events sauber an.
        if (force || Math.abs(video.currentTime - targetTime) > 0.012) {
          video.currentTime = targetTime;
        }
      } catch (error) {}
    }
  };

  const requestLocalUpdate = (force = false) => {
    if (!isMobileLike) return;
    if (localRaf) return;
    localRaf = window.requestAnimationFrame(() => {
      localRaf = 0;
      measure();
      update(force);
    });
  };

  const loadAndUpdate = () => {
    try { video.load(); } catch (error) {}
    requestLocalUpdate(true);
  };

  ['loadedmetadata', 'loadeddata', 'durationchange', 'canplay'].forEach(eventName => {
    video.addEventListener(eventName, () => requestLocalUpdate(true), { passive: true });
  });

  // V42: Direkte Mobile-Safari-Listener wie in der funktionierenden Mobile-Version,
  // aber nur für Mobile/Coarse Pointer. Desktop bleibt dadurch unberührt.
  window.addEventListener('scroll', () => requestLocalUpdate(false), { passive: true });
  window.addEventListener('touchmove', () => requestLocalUpdate(false), { passive: true });
  window.addEventListener('touchstart', () => requestLocalUpdate(true), { passive: true });
  window.addEventListener('resize', () => requestLocalUpdate(true), { passive: true });
  window.addEventListener('orientationchange', () => {
    window.setTimeout(() => requestLocalUpdate(true), 260);
  }, { passive: true });

  measure();
  loadAndUpdate();
  window.setTimeout(() => requestLocalUpdate(true), 250);
  window.setTimeout(() => requestLocalUpdate(true), 900);
  window.setTimeout(() => requestLocalUpdate(true), 1600);

  return { measure, update };
}

function setupRevealObserver() {
  const elements = $$('.reveal');
  if (!elements.length) return;

  if (!('IntersectionObserver' in window)) {
    elements.forEach(element => element.classList.add('show'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' });

  elements.forEach(element => observer.observe(element));

  window.addEventListener('load', () => {
    elements.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.top < viewportHeight * 0.92) element.classList.add('show');
    });
  });
}

function setupCursorGlow() {
  const glow = $('.cursor-glow');
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  if (!glow || !finePointer || isMobileLike || reduceMotion) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let glowX = mouseX;
  let glowY = mouseY;
  let raf = 0;
  let restFrames = 0;

  const animate = () => {
    raf = 0;
    glowX += (mouseX - glowX) * 0.095;
    glowY += (mouseY - glowY) * 0.095;
    glow.style.transform = `translate3d(${glowX}px,${glowY}px,0) translate(-50%,-50%)`;

    restFrames -= 1;
    if (restFrames > 0 || Math.abs(mouseX - glowX) > 0.5 || Math.abs(mouseY - glowY) > 0.5) {
      raf = window.requestAnimationFrame(animate);
    }
  };

  window.addEventListener('pointermove', event => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    restFrames = 28;
    if (!raf) raf = window.requestAnimationFrame(animate);
  }, { passive: true });
}

setupRevealObserver();
setupCursorGlow();

const heroFilm = createScrollFilm({
  sectionSelector: '#hero-scroll',
  videoSelector: '#scrollVideo',
  progressSelector: '.progress-line i',
  copySelector: '.hero-copy',
  buttonSelector: '.chapter-ui button',
  steps: 6,
  smooth: 0.15
});

const midFilm = createScrollFilm({
  sectionSelector: '#showcase',
  videoSelector: '#midScrollVideo',
  progressSelector: '.mid-progress i',
  copySelector: '.mid-copy',
  buttonSelector: '.mid-chapter-ui button',
  steps: 4,
  smooth: 0.15
});

const references = createReferenceShowcase();
const parallax = createParallaxController();
const mobileHeroScrub = setupMobileVideoScrubbing('#hero-scroll', '#scrollVideo');
const mobileMidScrub = setupMobileVideoScrubbing('#showcase', '#midScrollVideo');

const controllers = [heroFilm, midFilm, references, parallax, mobileHeroScrub, mobileMidScrub];

let rafId = 0;
let settlingFrames = 0;
let resizeTimer = 0;

function measureAll() {
  refreshViewport();
  controllers.forEach(controller => controller.measure?.());
}

function runFrame(force = false) {
  rafId = 0;

  let needsMoreFrames = false;
  controllers.forEach(controller => {
    if (controller.update?.(force)) needsMoreFrames = true;
  });

  if (settlingFrames > 0) {
    settlingFrames -= 1;
    needsMoreFrames = true;
  }

  if (needsMoreFrames) {
    rafId = window.requestAnimationFrame(() => runFrame(false));
  }
}

function requestFrame(extraFrames = 8, force = false) {
  settlingFrames = Math.max(settlingFrames, extraFrames);
  if (!rafId) {
    rafId = window.requestAnimationFrame(() => runFrame(force));
  }
}

window.addEventListener('scroll', () => requestFrame(isMobileLike ? 2 : 10), { passive: true });
window.addEventListener('resize', () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    measureAll();
    requestFrame(18, true);
  }, 120);
}, { passive: true });
window.addEventListener('orientationchange', () => {
  window.setTimeout(() => {
    measureAll();
    requestFrame(18, true);
  }, 260);
}, { passive: true });
window.addEventListener('load', () => {
  measureAll();
  requestFrame(24, true);

  window.setTimeout(() => {
    $$('video').forEach(video => {
      if (video.readyState === 0) {
        document.documentElement.classList.add('video-metadata-blocked');
      }
    });
  }, 1800);
});

media.mobileLike.addEventListener?.('change', () => {
  measureAll();
  requestFrame(18, true);
});
media.reducedMotion.addEventListener?.('change', () => {
  measureAll();
  requestFrame(18, true);
});

$$('.refs-card img, .section-bg img').forEach(image => {
  image.addEventListener('error', () => {
    console.error('Bild konnte nicht geladen werden:', image.getAttribute('src'));
  });
});

measureAll();
requestFrame(18, true);
