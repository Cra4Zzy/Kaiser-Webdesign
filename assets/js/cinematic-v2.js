
(() => {
  const body = document.body;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (n, min=0, max=1) => Math.min(max, Math.max(min, n));
  const progressFill = document.querySelector('[data-progress-fill]');
  const header = document.querySelector('[data-header]');
  const cursor = document.querySelector('[data-cursor]');
  const mobilePanel = document.querySelector('[data-mobile-panel]');
  const openBtn = document.querySelector('[data-mobile-toggle]');
  const closeBtn = document.querySelector('[data-mobile-close]');
  const revealItems = [...document.querySelectorAll('.reveal')];
  const stories = [...document.querySelectorAll('[data-story]')];
  const horizontals = [...document.querySelectorAll('[data-horizontal]')];
  const heroes = [...document.querySelectorAll('[data-hero]')];
  const magnets = [...document.querySelectorAll('.magnetic')];

  const openMenu = () => body.classList.add('nav-open');
  const closeMenu = () => body.classList.remove('nav-open');
  if (openBtn) openBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (mobilePanel) {
    mobilePanel.addEventListener('click', (e) => { if (e.target === mobilePanel) closeMenu(); });
    mobilePanel.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  }
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  if (revealItems.length && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold:.16, rootMargin:'0px 0px -7% 0px' });
    revealItems.forEach((el, i) => { el.style.setProperty('--delay', `${Math.min(i % 5, 4) * 70}ms`); io.observe(el); });
  } else revealItems.forEach(el => el.classList.add('is-visible'));

  let ticking = false;
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? scrollY / max : 0;
    if (progressFill) progressFill.style.width = `${clamp(p) * 100}%`;
    if (header) header.classList.toggle('is-scrolled', scrollY > 24);
  };

  const updateHero = () => {
    if (reduced) return;
    heroes.forEach(hero => {
      const rect = hero.getBoundingClientRect();
      const p = clamp(-rect.top / Math.max(1, rect.height - innerHeight));
      hero.style.setProperty('--hero-scale', (1.08 + p * .09).toFixed(3));
      hero.style.setProperty('--hero-y', `${p * 42}px`);
      hero.style.setProperty('--panel-y', `${p * -28}px`);
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
    updateHero();
    updateStories();
    updateHorizontal();
  };
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', request, { passive:true });
  addEventListener('resize', request);
  addEventListener('load', () => { update(); setTimeout(update, 250); });
  update();

  if (!reduced && cursor && matchMedia('(pointer:fine)').matches) {
    let px = innerWidth/2, py = innerHeight/2, x = px, y = py;
    addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; cursor.classList.add('is-active'); }, { passive:true });
    document.querySelectorAll('a,button,.feature-frame,.image-card,.glass-card').forEach(el => {
      el.addEventListener('pointerenter', () => cursor.classList.add('is-hovering'));
      el.addEventListener('pointerleave', () => cursor.classList.remove('is-hovering'));
    });
    const loop = () => { x += (px-x)*.16; y += (py-y)*.16; cursor.style.transform = `translate(${x}px, ${y}px) translate(-50%,-50%)`; requestAnimationFrame(loop); };
    loop();
  }

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
