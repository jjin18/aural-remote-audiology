import { animate } from './vendor/motion-mini.js';

const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const hero = document.querySelector('.hero');
const heroCopy = document.querySelector('.hero-copy');
const journey = document.querySelector('.journey');
const instrument = document.querySelector('.instrument');
const chapters = [...document.querySelectorAll('.chapter')];
const state = document.querySelector('#session-state');
const review = document.querySelector('#review-state');
const states = ['Equipment readiness', 'Remote supervision', 'Clinician review'];
const reviews = ['Prepare', 'Test & interpret', 'Document'];
const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));
const ease = [.22, 1, .36, 1];
let frame = 0;
let activeStep = -1;
let heroProgress = 0;
let revealAnimations = [];
let entryAnimations = [];

function setupTypography() {
  revealAnimations.forEach(({controls}) => controls.cancel());
  revealAnimations = [];
  document.querySelectorAll('[data-reveal]').forEach(block => {
    const words = [...block.querySelectorAll('.word')];
    const subjects = words.length ? words : [block.querySelector('p') || block];
    subjects.forEach((element, index) => {
      // A restrained adaptation of Codrops' MIT effect6, implemented with Motion.
      const keyframes = reducedMotion.matches
        ? {opacity: [.28, 1]}
        : {opacity: [.08, 1], transform: ['perspective(1000px) translateY(38px) rotateX(-18deg)', 'perspective(1000px) translateY(0px) rotateX(0deg)']};
      const controls = animate(element, keyframes, {duration: 1, ease, autoplay: false});
      controls.pause();
      revealAnimations.push({block, controls, index});
    });
  });
}

function playEntry() {
  entryAnimations.forEach(animation => animation.cancel());
  entryAnimations = [];
  const subjects = [document.querySelector('.hero-intro'), ...document.querySelectorAll('h1 .line>span'), document.querySelector('.hero-cta')];
  subjects.forEach((el, index) => {
    const keyframes = reducedMotion.matches
      ? {opacity: [0, 1]}
      : {opacity: [0, 1], transform: [index === 0 ? 'translateY(12px)' : 'perspective(1000px) translateY(105%) rotateX(-14deg)', 'perspective(1000px) translateY(0px) rotateX(0deg)']};
    entryAnimations.push(animate(el, keyframes, {duration: reducedMotion.matches ? .8 : 1.35, delay: index * .15, ease}));
  });
}

// All layout reads precede style writes. No replacement of native scrolling.
function updateScroll() {
  frame = 0;
  const vh = innerHeight;
  const heroBox = hero.getBoundingClientRect();
  const journeyBox = journey.getBoundingClientRect();
  const chapterBoxes = chapters.map(chapter => chapter.getBoundingClientRect());
  const blockRects = new Map();
  revealAnimations.forEach(item => {
    if (!blockRects.has(item.block)) blockRects.set(item.block, item.block.getBoundingClientRect());
  });
  const firstCenter = chapterBoxes[0].top + chapterBoxes[0].height / 2;
  const lastCenter = chapterBoxes[2].top + chapterBoxes[2].height / 2;
  const progress = clamp((vh / 2 - firstCenter) / (lastCenter - firstCenter));
  const closest = chapterBoxes.reduce((best, box, index) => {
    const distance = Math.abs(box.top + box.height / 2 - vh / 2);
    return distance < best.distance ? {index, distance} : best;
  }, {index: 0, distance: Infinity}).index;
  heroProgress = clamp(-heroBox.top / heroBox.height);
  root.classList.toggle('has-scrolled', scrollY > 24);
  if (!reducedMotion.matches && heroBox.bottom > 0) {
    heroCopy.style.transform = `translateY(${-heroProgress * 45}px) scale(${1 - heroProgress * .035})`;
  } else heroCopy.style.transform = '';
  if (journeyBox.top < vh && journeyBox.bottom > 0) {
    journey.style.setProperty('--session-progress', progress.toFixed(4));
    journey.style.setProperty('--trace-progress', clamp(progress / .72, .08, 1).toFixed(4));
    instrument.style.transform = reducedMotion.matches ? '' : `translateY(${(1 - progress) * 12}px) scale(${.97 + progress * .03})`;
  }
  revealAnimations.forEach(({block, controls, index}) => {
    const box = blockRects.get(block);
    const target = clamp((vh * .94 - box.top) / (vh * .44));
    controls.time = clamp((target - index * .055) / (1 - index * .055));
  });
  if (closest !== activeStep) {
    activeStep = closest;
    state.textContent = states[closest];
    review.textContent = reviews[closest];
    journey.dataset.active = String(closest);
  }
}
function requestScroll() { if (!frame) frame = requestAnimationFrame(updateScroll); }
setupTypography();
playEntry();
root.classList.add('flow-ready');
addEventListener('scroll', requestScroll, {passive: true});
addEventListener('resize', requestScroll, {passive: true});
reducedMotion.addEventListener('change', () => { setupTypography(); requestScroll(); });
updateScroll();

// A small 2D sound field, not a video or WebGL scene. Only visible frames draw.
const canvas = document.querySelector('.sound-canvas');
const ctx = canvas.getContext('2d');
let waveFrame = 0;
let waveVisible = true;
let waveWidth = 0;
let waveHeight = 0;
let lastTime = 0;
let elapsed = 0;
const field = document.querySelector('.sound-field');
function sizeWave() {
  const box = field.getBoundingClientRect();
  waveWidth = box.width;
  waveHeight = box.height;
  const ratio = Math.min(devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(waveWidth * ratio);
  canvas.height = Math.round(waveHeight * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}
function drawWave(time) {
  waveFrame = 0;
  if (!waveVisible || document.hidden) { lastTime = 0; return; }
  if (lastTime) elapsed += Math.min(time - lastTime, 50) / 1000;
  lastTime = time;
  const t = elapsed;
  ctx.clearRect(0, 0, waveWidth, waveHeight);
  const light = ctx.createLinearGradient(0, 0, waveWidth, waveHeight * .4);
  const blend = .5 + Math.sin(t * .27) * .5;
  light.addColorStop(0, `rgba(132,163,210,${.44 + blend * .22})`);
  light.addColorStop(.45, `rgba(220,223,239,${.76 - blend * .15})`);
  light.addColorStop(.72, `rgba(197,174,200,${.48 + blend * .2})`);
  light.addColorStop(1, 'rgba(220,201,175,.55)');
  ctx.strokeStyle = light;
  ctx.lineWidth = waveWidth < 600 ? 1.15 : 1.3;
  ctx.lineCap = 'round';
  const count = Math.min(240, Math.round(waveWidth / 6));
  const convergence = reducedMotion.matches ? .08 : heroProgress * .2;
  const c1 = .27 + convergence + (reducedMotion.matches ? 0 : Math.sin(t * .32) * .035);
  const c2 = .73 - convergence + (reducedMotion.matches ? 0 : Math.cos(t * .28) * .035);
  const spatialTime = reducedMotion.matches ? 0 : t;
  ctx.beginPath();
  for (let i = 0; i <= count; i++) {
    const u = i / count;
    const envelope1 = Math.exp(-Math.pow((u - c1) / .13, 2));
    const envelope2 = Math.exp(-Math.pow((u - c2) / .13, 2));
    const shape = .5 + .5 * Math.sin(u * 26 - spatialTime * .8) * Math.cos(u * 10 + spatialTime * .45);
    const breath = reducedMotion.matches ? .96 + Math.sin(t * .4 + u * 3) * .04 : 1;
    const height = 2 + Math.min(1.4, envelope1 + envelope2) * waveHeight * (.18 + shape * .2) * breath;
    const center = waveHeight * .5 + Math.sin(u * 7 + spatialTime * .3) * waveHeight * .025;
    const x = u * waveWidth;
    ctx.moveTo(x, center - height);
    ctx.lineTo(x, center + height);
  }
  ctx.stroke();
  waveFrame = requestAnimationFrame(drawWave);
}
function startWave() {
  if (waveVisible && !document.hidden && !waveFrame) waveFrame = requestAnimationFrame(drawWave);
}
if (ctx) {
  sizeWave();
  hero.classList.add('canvas-ready');
  if ('ResizeObserver' in window) new ResizeObserver(sizeWave).observe(field);
  else addEventListener('resize', sizeWave, {passive: true});
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      waveVisible = entries[0].isIntersecting;
      hero.classList.toggle('is-offscreen', !waveVisible);
      if (waveVisible) startWave();
    }).observe(hero);
  }
  document.addEventListener('visibilitychange', () => {
    document.querySelectorAll('.light-cloud').forEach(cloud => cloud.style.animationPlayState = document.hidden ? 'paused' : '');
    startWave();
  });
  startWave();
}

if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle('is-offscreen', !entry.isIntersecting))).observe(document.querySelector('.closing'));
}

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
  link.href = url; link.download = 'aural-partnership-brief.txt';
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  document.querySelector('#form-status').textContent = 'Your brief is ready. Nothing has been sent.';
});
