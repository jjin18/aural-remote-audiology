const journey=document.querySelector('.journey');
const states=['Equipment readiness','Remote supervision','Clinician review'];
const reviews=['01 / PREPARE','02 / TEST & INTERPRET','03 / DOCUMENT'];
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){const step=Number(entry.target.dataset.step);journey.dataset.active=step;journey.style.setProperty('--progress',step/2);document.querySelector('#session-state').textContent=states[step];document.querySelector('#review-state').textContent=reviews[step];}}},{rootMargin:'-35% 0px -35% 0px',threshold:0});document.querySelectorAll('.chapter').forEach(el=>observer.observe(el));}
const dialog=document.querySelector('dialog');
document.querySelector('.closing .partnership').addEventListener('click',()=>dialog.showModal());
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
document.querySelector('#enquiry-form').addEventListener('submit',event=>{event.preventDefault();const clinic=document.querySelector('#clinic-name').value.trim();const needs=document.querySelector('#needs').value.trim();if(!clinic||!needs)return;const content=`AURAL / PARTNERSHIP BRIEF\n\nOrganization: ${clinic}\n\nCoverage needs:\n${needs}\n\nPrepared locally. This brief has not been sent to Aural.\nA contact channel has not yet been announced.\n`;const url=URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='aural-partnership-brief.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);document.querySelector('#form-status').textContent='Your brief is ready. Nothing has been sent.';});

// Coalesce native scroll events into one frame. No scroll interception or inertia.
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const hero=document.querySelector('.hero');
const closing=document.querySelector('.closing');
const chapters=[...document.querySelectorAll('.chapter')];
const clamp=value=>Math.min(1,Math.max(0,value));
let framePending=false;
function renderScroll(){
  framePending=false;
  const vh=window.innerHeight;
  const rect=journey.getBoundingClientRect();
  const progress=clamp((vh*.65-rect.top)/(rect.height-vh*.2));
  journey.style.setProperty('--session-progress',progress);
  journey.style.setProperty('--trace-progress',clamp((progress-.12)/.58));
  if(!reducedMotion.matches){
    hero.style.setProperty('--hero-scroll',clamp(-hero.getBoundingClientRect().top/hero.offsetHeight));
    closing.style.setProperty('--closing-progress',clamp((vh-closing.getBoundingClientRect().top)/vh));
  }
  chapters.forEach(chapter=>{const r=chapter.getBoundingClientRect();chapter.classList.toggle('is-visible',r.top<vh*.8&&r.bottom>vh*.2);});
}
function scheduleScroll(){if(!framePending){framePending=true;requestAnimationFrame(renderScroll);}}
if('IntersectionObserver' in window){document.documentElement.classList.add('motion-ready');}
window.addEventListener('scroll',scheduleScroll,{passive:true});
window.addEventListener('resize',scheduleScroll,{passive:true});
reducedMotion.addEventListener('change',scheduleScroll);
renderScroll();

// Pointer-controlled light and bounded tilt; touch keeps a static highlight.
const discover=document.querySelector('.discover');
const finePointer=window.matchMedia('(hover: hover) and (pointer: fine)');
let lightFrame=0;
let lightPosition={x:.5,y:.5};
function paintLight(){lightFrame=0;const {x,y}=lightPosition;discover.style.setProperty('--light-x',`${x*100}%`);discover.style.setProperty('--light-y',`${y*100}%`);discover.style.setProperty('--tilt-x',`${(.5-y)*7}deg`);discover.style.setProperty('--tilt-y',`${(x-.5)*9}deg`);}
discover.addEventListener('pointermove',event=>{if(!finePointer.matches||reducedMotion.matches)return;const rect=discover.getBoundingClientRect();lightPosition={x:clamp((event.clientX-rect.left)/rect.width),y:clamp((event.clientY-rect.top)/rect.height)};if(!lightFrame)lightFrame=requestAnimationFrame(paintLight);});
function resetLight(){if(lightFrame)cancelAnimationFrame(lightFrame);lightFrame=0;lightPosition={x:.5,y:.5};paintLight();}
discover.addEventListener('pointerleave',resetLight);
discover.addEventListener('blur',resetLight);
reducedMotion.addEventListener('change',resetLight);

// Shared pointer response: bounded travel, one scheduled paint per frame, no idle loop.
const materialSurfaces=[hero,document.querySelector('.instrument'),document.querySelector('.technology'),closing,...document.querySelectorAll('.partnership')];
materialSurfaces.forEach(surface=>{
 let scheduled=0;let px=.5;let py=.5;
 function paint(){scheduled=0;surface.style.setProperty('--surface-x',`${px*100}%`);surface.style.setProperty('--surface-y',`${py*100}%`);surface.style.setProperty('--surface-rx',`${(.5-py)*4}deg`);surface.style.setProperty('--surface-ry',`${(px-.5)*6}deg`);if(surface===hero){surface.style.setProperty('--drift-x',`${(px-.5)*20}px`);surface.style.setProperty('--drift-y',`${(py-.5)*14}px`);surface.style.setProperty('--ring-x',`${(px-.5)*12}px`);surface.style.setProperty('--ring-y',`${(py-.5)*10}px`);}}
 function reset(){if(scheduled)cancelAnimationFrame(scheduled);px=py=.5;paint();}
 surface.addEventListener('pointermove',event=>{if(!finePointer.matches||reducedMotion.matches)return;const r=surface.getBoundingClientRect();px=clamp((event.clientX-r.left)/r.width);py=clamp((event.clientY-r.top)/r.height);if(!scheduled)scheduled=requestAnimationFrame(paint);},{passive:true});
 surface.addEventListener('pointerleave',reset);reducedMotion.addEventListener('change',reset);
});
if('IntersectionObserver' in window){const reveal=new IntersectionObserver(entries=>{entries.forEach(entry=>entry.target.classList.toggle('in-view',entry.isIntersecting));},{threshold:.12});document.querySelectorAll('.technology,.closing').forEach(el=>reveal.observe(el));}
let navigationFrame=0;
function updateNavigation(){navigationFrame=0;document.documentElement.classList.toggle('has-scrolled',window.scrollY>25);const range=document.documentElement.scrollHeight-window.innerHeight;document.documentElement.style.setProperty('--reading-progress',range>0?clamp(window.scrollY/range):0);}
window.addEventListener('scroll',()=>{if(!navigationFrame)navigationFrame=requestAnimationFrame(updateNavigation);},{passive:true});
window.addEventListener('resize',updateNavigation,{passive:true});updateNavigation();
