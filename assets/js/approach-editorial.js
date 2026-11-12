/* Kaiser Webdesign — a tiny, self-contained editorial interaction. */
(() => {
  const section = document.querySelector('#intro.approach');
  if (!section) return;
  const buttons = [...section.querySelectorAll('[data-approach-step]')];
  const fields = {
    index: section.querySelector('[data-approach-index]'),
    kicker: section.querySelector('[data-approach-kicker]'),
    title: section.querySelector('[data-approach-title]'),
    emphasis: section.querySelector('[data-approach-emphasis]'),
    description: section.querySelector('[data-approach-description]')
  };
  const content = section.querySelector('.approach__experience-content');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const steps = [
    {
      kicker: '01 / VERSTEHEN', title: 'Erst verstehen.', emphasis: 'Dann gestalten.',
      description: 'Bevor ich gestalte, geht es um dein Unternehmen: die Menschen dahinter, deine Stärken und die Frage, was deine Kunden wirklich überzeugt.'
    },
    {
      kicker: '02 / GESTALTEN', title: 'Keine Schablone.', emphasis: 'Deine Handschrift.',
      description: 'Aus dem, was dich besonders macht, entsteht ein eigenständiges Design. Mit einer klaren Bildsprache, passender Typografie und jedem Detail am richtigen Platz.'
    },
    {
      kicker: '03 / WIRKEN', title: 'Mehr als schön.', emphasis: 'Mit klarem Ziel.',
      description: 'Deine Website soll nicht nur Eindruck machen. Sie soll Orientierung geben, Vertrauen schaffen und aus interessierten Besuchern echte Anfragen machen.'
    }
  ];
  function activate(index, shouldFocus = false) {
    if (index < 0 || index >= steps.length) return;
    const data = steps[index];
    fields.index.textContent = String(index + 1).padStart(2, '0') + ' / 03';
    fields.kicker.textContent = data.kicker;
    fields.title.textContent = data.title;
    fields.emphasis.textContent = data.emphasis;
    fields.description.textContent = data.description;
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    if (!reducedMotion.matches) {
      content.classList.remove('is-switching');
      void content.offsetWidth;
      content.classList.add('is-switching');
    }
    if (shouldFocus) buttons[index].focus();
  }
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => activate(index));
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % buttons.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + buttons.length) % buttons.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = buttons.length - 1;
      else return;
      event.preventDefault();
      activate(next, true);
    });
  });
})();
