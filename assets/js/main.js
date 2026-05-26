(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;
  const progressFill = document.querySelector('.progress-bar__fill');
  const mobileToggle = document.querySelector('[data-mobile-toggle]');
  const mobilePanel = document.querySelector('[data-mobile-panel]');
  const mobileClose = document.querySelector('[data-mobile-close]');
  const mobileLinks = document.querySelectorAll('[data-mobile-panel] a');
  const revealItems = document.querySelectorAll('.reveal');
  const tiltItems = document.querySelectorAll('.tilt');
  const magneticItems = document.querySelectorAll('.magnetic');
  const countItems = document.querySelectorAll('[data-count]');
  const heroLayers = document.querySelectorAll('[data-depth]');
  const heroVisuals = document.querySelectorAll('[data-hero-visual]');
  const currentPage = body.dataset.page || 'home';
  const demoForms = document.querySelectorAll('[data-demo-form]');

  const setActiveNav = () => {
    document.querySelectorAll('[data-nav]').forEach((link) => {
      if (link.dataset.nav === currentPage) {
        link.classList.add('is-active');
      }
    });
  };

  const updateProgress = () => {
    if (!progressFill) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressFill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  };


  const openMenu = () => body.classList.add('nav-open');
  const closeMenu = () => body.classList.remove('nav-open');

  if (mobileToggle && mobilePanel) {
    mobileToggle.addEventListener('click', () => {
      if (body.classList.contains('nav-open')) closeMenu();
      else openMenu();
    });

    mobilePanel.addEventListener('click', (event) => {
      if (event.target === mobilePanel) closeMenu();
    });
  }

  if (mobileClose) mobileClose.addEventListener('click', closeMenu);
  mobileLinks.forEach((link) => link.addEventListener('click', closeMenu));
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  if (!prefersReducedMotion && revealItems.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });

    revealItems.forEach((item, index) => {
      item.style.setProperty('--delay', `${Math.min(index % 8, 7) * 80}ms`);
      observer.observe(item);
    });
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  const runCount = (el) => {
    const target = Number(el.dataset.count || 0);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const duration = 1400;
    const startTime = performance.now();

    const step = (now) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      el.textContent = `${prefix}${value}${suffix}`;
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  if (countItems.length) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          runCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    countItems.forEach((item) => countObserver.observe(item));
  }

  if (!prefersReducedMotion && heroVisuals.length) {
    const gyroScenes = [...document.querySelectorAll('[data-hero-gyro]')];
    const logoOrbits = [...document.querySelectorAll('[data-logo-orbit]')];
    let pointerX = 0;
    let pointerY = 0;

    const updatePointer = (event) => {
      pointerX = event.clientX / window.innerWidth - 0.5;
      pointerY = event.clientY / window.innerHeight - 0.5;
    };

    window.addEventListener('pointermove', updatePointer, { passive: true });

    const startTime = performance.now();

    const animateHeroScene = (now) => {
      const elapsed = now - startTime;

      gyroScenes.forEach((scene) => {
        const swayX = pointerY * -7;
        const swayY = pointerX * 11;
        scene.style.transform = `translate3d(${pointerX * 12}px, ${pointerY * 10}px, 0) rotateX(${swayX.toFixed(2)}deg) rotateY(${swayY.toFixed(2)}deg)`;

        scene.querySelectorAll('[data-axis-speed]').forEach((axis, index) => {
          const speed = Number(axis.dataset.axisSpeed || 0);
          const drift = Math.sin(elapsed / (1800 + index * 320)) * 9;
          const angle = elapsed * speed * 0.015 + drift;
          axis.style.setProperty('--axis-angle', `${angle.toFixed(2)}deg`);
        });
      });

      logoOrbits.forEach((orbit, index) => {
        const baseSpin = elapsed * (0.022 + index * 0.0025);
        const reverseSpin = -elapsed * (0.015 + index * 0.0018);
        const emblemSpin = Math.sin(elapsed / 2200) * 5 + baseSpin * 0.12;
        orbit.style.setProperty('--orbit-spin', `${baseSpin.toFixed(2)}deg`);
        orbit.style.setProperty('--orbit-spin-reverse', `${reverseSpin.toFixed(2)}deg`);
        orbit.style.setProperty('--orbit-spin-emblem', `${emblemSpin.toFixed(2)}deg`);
        orbit.style.setProperty('--orbit-float-x', `${(pointerX * 18).toFixed(2)}px`);
        orbit.style.setProperty('--orbit-float-y', `${(pointerY * 14).toFixed(2)}px`);
        orbit.style.setProperty('--orbit-tilt-x', `${(pointerY * -10).toFixed(2)}deg`);
        orbit.style.setProperty('--orbit-tilt-y', `${(pointerX * 14).toFixed(2)}deg`);
      });

      requestAnimationFrame(animateHeroScene);
    };

    requestAnimationFrame(animateHeroScene);
  }

  if (!prefersReducedMotion) {
    tiltItems.forEach((item) => {
      item.addEventListener('pointermove', (event) => {
        const rect = item.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const px = x / rect.width - 0.5;
        const py = y / rect.height - 0.5;
        item.style.setProperty('--tilt-rx', `${(-py * 8).toFixed(2)}deg`);
        item.style.setProperty('--tilt-ry', `${(px * 10).toFixed(2)}deg`);
        item.style.setProperty('--tilt-x', `${(px * 6).toFixed(2)}px`);
        item.style.setProperty('--tilt-y', `${(py * 5).toFixed(2)}px`);
      });

      item.addEventListener('pointerleave', () => {
        item.style.setProperty('--tilt-rx', '0deg');
        item.style.setProperty('--tilt-ry', '0deg');
        item.style.setProperty('--tilt-x', '0px');
        item.style.setProperty('--tilt-y', '0px');
      });
    });

    magneticItems.forEach((item) => {
      item.addEventListener('pointermove', (event) => {
        const rect = item.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        item.style.transform = `translate(${x * 0.12}px, ${y * 0.16}px)`;
      });

      item.addEventListener('pointerleave', () => {
        item.style.transform = 'translate(0, 0)';
      });
    });

    window.addEventListener('pointermove', (event) => {
      heroLayers.forEach((layer) => {
        const depth = Number(layer.dataset.depth || 0);
        const moveX = (event.clientX / window.innerWidth - 0.5) * depth;
        const moveY = (event.clientY / window.innerHeight - 0.5) * depth;
        layer.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
      });
    });
  }

  demoForms.forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const wrapper = form.closest('.form-card') || form.parentElement;
      if (!wrapper) return;
      wrapper.classList.add('is-sent');
      form.reset();
      const success = wrapper.querySelector('.form-success');
      if (success) {
        success.setAttribute('tabindex', '-1');
        success.focus({ preventScroll: true });
      }
    });
  });

  setActiveNav();
  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
})();
