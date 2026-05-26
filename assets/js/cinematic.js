(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;
  const progressFill = document.querySelector('[data-progress-fill]');
  const header = document.querySelector('[data-header]');
  const mobilePanel = document.querySelector('[data-mobile-panel]');
  const mobileToggle = document.querySelector('[data-mobile-toggle]');
  const mobileClose = document.querySelector('[data-mobile-close]');
  const revealItems = [...document.querySelectorAll('.reveal')];
  const magneticItems = [...document.querySelectorAll('.magnetic')];
  const cursor = document.querySelector('[data-cursor]');
  const story = document.querySelector('[data-story]');
  const horizontal = document.querySelector('[data-horizontal]');
  const hero = document.querySelector('[data-hero]');
  const parallaxItems = [...document.querySelectorAll('[data-parallax]')];

  let ticking = false;
  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;
  let cursorX = pointerX;
  let cursorY = pointerY;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  const updateProgress = () => {
    if (!progressFill) return;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    progressFill.style.width = `${clamp(progress) * 100}%`;
  };

  const setHeaderState = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 28);
  };

  const openMenu = () => body.classList.add('nav-open');
  const closeMenu = () => body.classList.remove('nav-open');

  if (mobileToggle && mobilePanel) {
    mobileToggle.addEventListener('click', openMenu);
    mobilePanel.addEventListener('click', (event) => {
      if (event.target === mobilePanel) closeMenu();
    });
    mobilePanel.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  }
  if (mobileClose) mobileClose.addEventListener('click', closeMenu);
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  if (revealItems.length && !prefersReducedMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -7% 0px' });

    revealItems.forEach((item, index) => {
      item.style.setProperty('--delay', `${Math.min(index % 5, 4) * 70}ms`);
      observer.observe(item);
    });
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  const updateHero = () => {
    if (!hero || prefersReducedMotion) return;
    const rect = hero.getBoundingClientRect();
    const progress = clamp(-rect.top / Math.max(1, rect.height - window.innerHeight));
    hero.style.setProperty('--hero-scale', `${1.08 + progress * 0.09}`);
    hero.style.setProperty('--hero-shift', `${progress * 44}px`);
    hero.style.setProperty('--console-y', `${progress * -34}px`);
  };

  const updateStory = () => {
    if (!story || prefersReducedMotion || window.innerWidth <= 780) return;
    const rect = story.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    const progress = clamp(-rect.top / Math.max(1, scrollable));
    const images = [...story.querySelectorAll('.director-media img')];
    const chapters = [...story.querySelectorAll('.chapter')];
    const progressEl = story.querySelector('[data-story-progress]');
    const activeIndex = clamp(Math.floor(progress * chapters.length), 0, chapters.length - 1);

    story.style.setProperty('--story-progress', progress.toFixed(4));
    if (progressEl) progressEl.style.width = `${progress * 100}%`;

    images.forEach((image, index) => image.classList.toggle('is-active', index === activeIndex));
    chapters.forEach((chapter, index) => chapter.classList.toggle('is-active', index === activeIndex));
  };

  const updateHorizontal = () => {
    if (!horizontal || prefersReducedMotion || window.innerWidth <= 780) return;
    const sticky = horizontal.querySelector('.horizontal-sticky');
    const track = horizontal.querySelector('[data-horizontal-track]');
    if (!sticky || !track) return;

    const rect = horizontal.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    const progress = clamp(-rect.top / Math.max(1, scrollable));
    const maxMove = Math.max(0, track.scrollWidth - sticky.clientWidth + 42);
    track.style.setProperty('--horizontal-x', `${-maxMove * progress}px`);
  };

  const updateParallax = () => {
    if (prefersReducedMotion) return;
    parallaxItems.forEach((item) => {
      const speed = Number(item.dataset.parallax || 0);
      const rect = item.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - window.innerHeight / 2;
      item.style.transform = `translate3d(0, ${center * speed}px, 0)`;
    });
  };

  const updateScrollSystems = () => {
    ticking = false;
    updateProgress();
    setHeaderState();
    updateHero();
    updateStory();
    updateHorizontal();
    updateParallax();
  };

  const requestTick = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateScrollSystems);
  };

  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);

  if (!prefersReducedMotion && cursor && window.matchMedia('(pointer:fine)').matches) {
    window.addEventListener('pointermove', (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      cursor.classList.add('is-active');
    }, { passive: true });

    document.querySelectorAll('a, button, .case-cinema-card, .service-frame').forEach((el) => {
      el.addEventListener('pointerenter', () => cursor.classList.add('is-hovering'));
      el.addEventListener('pointerleave', () => cursor.classList.remove('is-hovering'));
    });

    const animateCursor = () => {
      cursorX += (pointerX - cursorX) * 0.16;
      cursorY += (pointerY - cursorY) * 0.16;
      cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
      requestAnimationFrame(animateCursor);
    };
    animateCursor();
  }

  if (!prefersReducedMotion && magneticItems.length && window.matchMedia('(pointer:fine)').matches) {
    magneticItems.forEach((item) => {
      item.addEventListener('pointermove', (event) => {
        const rect = item.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        item.style.transform = `translate3d(${x * 0.16}px, ${y * 0.18}px, 0)`;
      });
      item.addEventListener('pointerleave', () => {
        item.style.transform = 'translate3d(0,0,0)';
      });
    });
  }

  updateScrollSystems();
  window.addEventListener('load', () => {
    updateScrollSystems();
    setTimeout(updateScrollSystems, 250);
  });
})();
