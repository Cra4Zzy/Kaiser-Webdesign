
(() => {
  const body = document.body;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (n, min=0, max=1) => Math.min(max, Math.max(min, n));
  const smooth = (edge0, edge1, x) => {
    const t = clamp((x - edge0) / Math.max(0.0001, edge1 - edge0));
    return t * t * (3 - 2 * t);
  };

  const progressFill = document.querySelector('[data-progress-fill]');
  const header = document.querySelector('[data-header]');
  const cursor = document.querySelector('[data-cursor]');
  const mobilePanel = document.querySelector('[data-mobile-panel]');
  const openBtn = document.querySelector('[data-mobile-toggle]');
  const closeBtn = document.querySelector('[data-mobile-close]');
  const revealItems = [...document.querySelectorAll('.reveal')];
  const stories = [...document.querySelectorAll('[data-story]')];
  const horizontals = [...document.querySelectorAll('[data-horizontal]')];
  const cinematicHeroes = [...document.querySelectorAll('[data-cinematic-hero]')];
  const magnets = [...document.querySelectorAll('.magnetic')];
  const stackedGroups = [...document.querySelectorAll('.stack-cards')];

  const openMenu = () => body.classList.add('nav-open');
  const closeMenu = () => body.classList.remove('nav-open');
  if (openBtn) openBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (mobilePanel) {
    mobilePanel.addEventListener('click', (e) => { if (e.target === mobilePanel) closeMenu(); });
    mobilePanel.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  }
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  if (stackedGroups.length && !reduced) {
    const stackObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-animated');
        stackObserver.unobserve(entry.target);
      });
    }, { threshold:.24, rootMargin:'0px 0px -8% 0px' });
    stackedGroups.forEach(group => stackObserver.observe(group));
  } else {
    stackedGroups.forEach(group => group.classList.add('is-animated'));
  }

  if (revealItems.length && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold:.14, rootMargin:'0px 0px -7% 0px' });
    revealItems.forEach((el, i) => {
      el.style.setProperty('--delay', `${Math.min(i % 6, 5) * 65}ms`);
      io.observe(el);
    });
  } else {
    revealItems.forEach(el => el.classList.add('is-visible'));
  }


  // Mobile-only polish: subtle staggered animations without chaotic scroll hijacking.
  const setupMobilePolish = () => {
    if (reduced || innerWidth > 780 || body.dataset.mobilePolish === 'ready') return;
    body.dataset.mobilePolish = 'ready';
    const riseSelectors = ['.section-head', '.proof-head', '.story-left', '.stack-copy', '.case-copy', '.contact-panel', '.form-panel', '.cta-cinema__copy'];
    const popSelectors = ['.float-card', '.glass-card', '.proof-card', '.case-thumb', '.chapter', '.feature-frame', '.process-card', '.case-tile'];
    const mobileItems = [
      ...document.querySelectorAll(riseSelectors.join(',')),
      ...document.querySelectorAll(popSelectors.join(','))
    ];
    mobileItems.forEach((el, i) => {
      if (popSelectors.some(sel => el.matches(sel))) el.classList.add('mobile-pop');
      else el.classList.add('mobile-rise');
      el.style.transitionDelay = `${Math.min(i % 5, 4) * 55}ms`;
    });
    const mobileObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        mobileObserver.unobserve(entry.target);
      });
    }, { threshold:.12, rootMargin:'0px 0px -4% 0px' });
    mobileItems.forEach(el => mobileObserver.observe(el));
  };
  setupMobilePolish();

  const responsiveProjectShots = [...document.querySelectorAll('img[data-mobile-src]')];
  const applyResponsiveProjectShots = () => {
    const mobile = innerWidth <= 780;
    responsiveProjectShots.forEach(img => {
      const desktopSrc = img.dataset.desktopSrc || img.getAttribute('src');
      const mobileSrc = img.dataset.mobileSrc || desktopSrc;
      const target = mobile ? mobileSrc : desktopSrc;
      if (target && img.getAttribute('src') !== target) img.setAttribute('src', target);
    });
  };
  applyResponsiveProjectShots();

  let ticking = false;

  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? scrollY / max : 0;
    if (progressFill) progressFill.style.width = `${clamp(p) * 100}%`;
    if (header) header.classList.toggle('is-scrolled', scrollY > 24);
  };

  const updateCinematicHeroes = () => {
    if (reduced) return;
    cinematicHeroes.forEach(hero => {
      const rect = hero.getBoundingClientRect();
      const scrollable = rect.height - innerHeight;
      const p = clamp(-rect.top / Math.max(1, scrollable));
      const open = 1 - smooth(.02, .30, p);
      const depth = smooth(.08, .36, p) * (1 - smooth(.58, .78, p));
      const transition = smooth(.36, .66, p) * (1 - smooth(.88, 1, p) * .42);
      const stage = smooth(.58, .86, p);
      const screens = smooth(.17, .55, p);
      const director = smooth(.32, .72, p);
      const glow = smooth(.10, .38, p) * (1 - smooth(.78, 1, p) * .35);
      const copyExit = smooth(.62, .9, p);
      hero.style.setProperty('--p', p.toFixed(4));
      hero.style.setProperty('--open', open.toFixed(4));
      hero.style.setProperty('--depth', depth.toFixed(4));
      hero.style.setProperty('--transition', transition.toFixed(4));
      hero.style.setProperty('--stage', stage.toFixed(4));
      hero.style.setProperty('--screens', screens.toFixed(4));
      hero.style.setProperty('--director', director.toFixed(4));
      hero.style.setProperty('--glow', glow.toFixed(4));
      hero.style.setProperty('--copy-exit', copyExit.toFixed(4));
    });
  };

  const updateStories = () => {
    if (reduced || innerWidth <= 780) return;
    stories.forEach(story => {
      const rect = story.getBoundingClientRect();
      const scrollable = rect.height - innerHeight;
      const p = clamp(-rect.top / Math.max(1, scrollable));
      const chapters = [...story.querySelectorAll('.chapter')];
      const imgs = [...story.querySelectorAll('.story-media img')];
      const fill = story.querySelector('[data-story-progress]');
      const active = Math.min(chapters.length - 1, Math.floor(p * chapters.length));
      if (fill) fill.style.width = `${p * 100}%`;
      chapters.forEach((c, i) => c.classList.toggle('is-active', i === active));
      imgs.forEach((img, i) => img.classList.toggle('is-active', i === active));
    });
  };

  const updateHorizontal = () => {
    if (reduced || innerWidth <= 780) return;
    horizontals.forEach(section => {
      const sticky = section.querySelector('.horizontal-sticky');
      const track = section.querySelector('.horizontal-track');
      if (!sticky || !track) return;
      const rect = section.getBoundingClientRect();
      const scrollable = rect.height - innerHeight;
      const p = clamp(-rect.top / Math.max(1, scrollable));
      const maxMove = Math.max(0, track.scrollWidth - sticky.clientWidth + 44);
      track.style.setProperty('--x', `${-maxMove * p}px`);
    });
  };

  const update = () => {
    ticking = false;
    updateProgress();
    updateCinematicHeroes();
    updateStories();
    updateHorizontal();
  };

  const request = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  addEventListener('scroll', request, { passive:true });
  addEventListener('resize', () => { setupMobilePolish(); applyResponsiveProjectShots(); request(); });
  addEventListener('load', () => { applyResponsiveProjectShots(); update(); setTimeout(update, 250); });
  update();

  if (!reduced && cursor && matchMedia('(pointer:fine)').matches) {
    let px = innerWidth/2, py = innerHeight/2, x = px, y = py;
    addEventListener('pointermove', e => {
      px = e.clientX; py = e.clientY;
      cursor.classList.add('is-active');
    }, { passive:true });
    document.querySelectorAll('a,button,.feature-frame,.proof-card,.case-tile,.float-card,.glass-card').forEach(el => {
      el.addEventListener('pointerenter', () => cursor.classList.add('is-hovering'));
      el.addEventListener('pointerleave', () => cursor.classList.remove('is-hovering'));
    });
    const loop = () => {
      x += (px-x)*.16; y += (py-y)*.16;
      cursor.style.transform = `translate(${x}px, ${y}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    };
    loop();
  }


  const linkedCards = document.querySelectorAll('.feature-frame[data-project-link], .proof-card[data-project-link]');
  linkedCards.forEach(frame => {
    let startX = 0, startY = 0, moved = false;
    frame.addEventListener('pointerdown', (event) => {
      startX = event.clientX; startY = event.clientY; moved = false;
    }, { passive:true });
    frame.addEventListener('pointermove', (event) => {
      if (Math.abs(event.clientX - startX) > 10 || Math.abs(event.clientY - startY) > 10) moved = true;
    }, { passive:true });
    frame.addEventListener('click', (event) => {
      if (moved || event.target.closest('a, button')) return;
      const href = frame.getAttribute('data-project-link');
      if (href) window.open(href, '_blank', 'noopener');
    });
  });

  if (!reduced && magnets.length && matchMedia('(pointer:fine)').matches) {
    magnets.forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate3d(${x*.14}px,${y*.16}px,0)`;
      });
      el.addEventListener('pointerleave', () => el.style.transform = 'translate3d(0,0,0)');
    });
  }
})();
