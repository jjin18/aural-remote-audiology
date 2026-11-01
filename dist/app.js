(() => {
  'use strict';
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let motionEnabled = !reducedMotion.matches;
  let explicitMotionChoice = false;
  const motionToggle = document.querySelector('.motion-toggle');
  function updateMotion() {
    root.dataset.motion = motionEnabled ? 'full' : 'reduced';
    motionToggle.setAttribute('aria-pressed', String(motionEnabled));
    motionToggle.setAttribute('aria-label', motionEnabled ? 'Disable animations' : 'Enable animations');
    motionToggle.querySelector('.motion-label').textContent = motionEnabled ? 'Motion on' : 'Motion off';
    requestRender();
  }
  motionToggle.hidden = false;
  motionToggle.addEventListener('click', () => {
    explicitMotionChoice = true;
    motionEnabled = !motionEnabled;
    updateMotion();
  });
  const hero = document.querySelector('.hero');
  const journey = document.querySelector('.journey');
  const chapters = [...document.querySelectorAll('.chapter')];
  const state = document.querySelector('#session-state');
  const review = document.querySelector('#review-state');
  const states = ['Equipment readiness', 'Remote supervision', 'Clinician review'];
  const reviews = ['01 / PREPARE', '02 / TEST & INTERPRET', '03 / DOCUMENT'];
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  let frame = 0;
  let activeStep = -1;

  // Native scrolling drives only a few bounded visual values, once per frame.
  function renderScroll() {
    frame = 0;
    const viewportHeight = window.innerHeight;
    const heroBox = hero.getBoundingClientRect();
    const journeyBox = journey.getBoundingClientRect();
    const chapterBoxes = chapters.map(chapter => chapter.getBoundingClientRect());
    const closest = chapterBoxes.reduce((best, box, index) => {
      const distance = Math.abs(box.top + box.height / 2 - viewportHeight / 2);
      return distance < best.distance ? {index, distance} : best;
    }, {index: 0, distance: Infinity}).index;
    const firstCenter = chapterBoxes[0].top + chapterBoxes[0].height / 2;
    const lastCenter = chapterBoxes[2].top + chapterBoxes[2].height / 2;
    const progress = clamp((viewportHeight / 2 - firstCenter) / (lastCenter - firstCenter));
    root.classList.toggle('has-scrolled', window.scrollY > 24);
    hero.classList.toggle('is-offscreen', heroBox.bottom < 0);
    if (motionEnabled) {
      if (heroBox.bottom > 0) hero.style.setProperty('--hero-progress', clamp(-heroBox.top / (heroBox.height * .8)).toFixed(4));
      if (journeyBox.top < viewportHeight && journeyBox.bottom > 0) {
        journey.style.setProperty('--session-progress', progress.toFixed(4));
        journey.style.setProperty('--trace-progress', clamp(progress / .72, .08, 1).toFixed(4));
      }
    } else {
      journey.style.setProperty('--session-progress', '1');
      journey.style.setProperty('--trace-progress', '1');
    }
    if (closest !== activeStep) {
      activeStep = closest;
      journey.dataset.active = String(closest);
      state.textContent = states[closest];
      review.textContent = reviews[closest];
    }
  }
  function requestRender() {
    if (!frame) frame = window.requestAnimationFrame(renderScroll);
  }

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {threshold: .12, rootMargin: '0px 0px -7% 0px'});
    document.querySelectorAll('[data-reveal]').forEach(block => {
      block.querySelectorAll('.word').forEach((word, index) => word.style.setProperty('--word-index', index));
      revealObserver.observe(block);
    });
    root.classList.add('motion-enabled');
  }
  window.addEventListener('scroll', requestRender, {passive: true});
  window.addEventListener('resize', requestRender, {passive: true});
  reducedMotion.addEventListener('change', () => {
    if (!explicitMotionChoice) motionEnabled = !reducedMotion.matches;
    updateMotion();
  });
  updateMotion();
  renderScroll();

  const dialog = document.querySelector('dialog');
  const openButton = document.querySelector('.closing .partnership');
  openButton.addEventListener('click', () => dialog.showModal());
  dialog.addEventListener('close', () => openButton.focus({preventScroll: true}));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  document.querySelector('#enquiry-form').addEventListener('submit', event => {
    event.preventDefault();
    const clinic = document.querySelector('#clinic-name').value.trim();
    const needs = document.querySelector('#needs').value.trim();
    if (!clinic || !needs) return;
    const content = `AURAL / PARTNERSHIP BRIEF\n\nOrganization: ${clinic}\n\nCoverage needs:\n${needs}\n\nPrepared locally. This brief has not been sent to Aural.\nA contact channel has not yet been announced.\n`;
    const url = URL.createObjectURL(new Blob([content], {type: 'text/plain;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'aural-partnership-brief.txt';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    document.querySelector('#form-status').textContent = 'Your brief is ready. Nothing has been sent.';
  });
})();
