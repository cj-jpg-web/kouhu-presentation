const deck = document.getElementById('deck');
const slides = [...document.querySelectorAll('.slide')];
const darkSlides = new Set([1,4,7,8,10]);
let current = 0;
let currentBuild = 0;
let isTransitioning = false;

function fitDeck(){
  const scale = Math.min(window.innerWidth/1600, window.innerHeight/900);
  document.documentElement.style.setProperty('--scale', scale);
  deck.style.left=`${(window.innerWidth-1600*scale)/2}px`;
  deck.style.top=`${(window.innerHeight-900*scale)/2}px`;
}

function maxBuild(index=current){
  return Math.max(0,...[...slides[index].querySelectorAll('[data-build]')].map(el=>Number(el.dataset.build)||0));
}

function updateBuilds(){
  const max=maxBuild();
  slides[current].querySelectorAll('[data-build]').forEach(el=>{
    el.classList.toggle('revealed',(Number(el.dataset.build)||0)<=currentBuild);
  });
  const status=document.getElementById('buildStatus');
  status.innerHTML='';
  status.classList.toggle('visible',max>0);
  for(let i=1;i<=max;i++){
    const dot=document.createElement('i');
    dot.classList.toggle('done',i<=currentBuild);
    dot.setAttribute('aria-label',`Build ${i} of ${max}`);
    status.append(dot);
  }
}

function activateSlide(next,entry='forward'){
  next = Math.max(0,Math.min(slides.length-1,next));
  if(next === current && slides[next].classList.contains('active')) return;
  slides.forEach((slide,i)=>{
    slide.classList.toggle('was-active',i<next);
    slide.classList.toggle('active',i===next);
  });
  current = next;
  currentBuild=entry==='backward'?maxBuild(current):0;
  updateBuilds();
  document.body.classList.toggle('dark-chrome',darkSlides.has(current));
  document.getElementById('progressBar').style.width=`${((current+1)/slides.length)*100}%`;
  const counter = document.getElementById('slideCounter');
  if(counter) counter.innerHTML = `<b>${String(current+1).padStart(2,'0')}</b><i> / ${String(slides.length).padStart(2,'0')}</i>`;
  document.querySelectorAll('.index-card').forEach((card,i)=>card.classList.toggle('selected',i===current));
  history.replaceState(null,'',`#${current+1}`);
  deck.scrollTop=0;
  requestAnimationFrame(()=>deck.scrollTop=0);
}

function showSlide(next,entry='forward'){
  next = Math.max(0,Math.min(slides.length-1,next));
  if(next === current && slides[next].classList.contains('active')) return;
  if(current < 0 || !slides.some(slide=>slide.classList.contains('active'))){
    activateSlide(next,entry);
    return;
  }
  if(isTransitioning) return;
  isTransitioning=true;
  deck.dataset.transition=String(next%4);
  deck.dataset.direction=next>current?'forward':'backward';
  deck.classList.add('scene-changing');
  window.setTimeout(()=>activateSlide(next,entry),210);
  window.setTimeout(()=>{
    deck.classList.remove('scene-changing');
    isTransitioning=false;
  },690);
}

function next(){
  if(isTransitioning)return;
  const max=maxBuild();
  if(currentBuild<max){currentBuild++;updateBuilds();return}
  if(current<slides.length-1)showSlide(current+1,'forward');
}

function replayOpening(){
  history.replaceState(null,'','#1');
  window.location.reload();
}

function prev(){
  if(isTransitioning)return;
  if(currentBuild>0){currentBuild--;updateBuilds();return}
  if(current===1){
    replayOpening();
    return;
  }
  if(current>0)showSlide(current-1,'backward');
}
document.getElementById('next').addEventListener('click',next);
document.getElementById('prev').addEventListener('click',prev);
document.querySelectorAll('[data-next]').forEach(el=>el.addEventListener('click',next));
document.querySelectorAll('[data-goto]').forEach(el=>el.addEventListener('click',()=>{
  const target=Number(el.dataset.goto);
  if(target===0 && current>0) replayOpening();
  else showSlide(target,'forward');
}));

const index=document.getElementById('slideIndex');
const indexGrid=document.getElementById('indexGrid');
const thumbs=['campus-hero-v2.webp','flag-ceremony-v2.webp','doorway-hero-v2.webp','late-hero-v2.webp','english-class-hero-v2.webp','corridor-hero-v2.webp','weekly-practice-v4.webp','english-class-hero-v2.webp','understanding-gesture-v4.webp','english-corridor-01.jpg','campus-hero-v2.webp'];
slides.forEach((slide,i)=>{
  const card=document.createElement('button');
  card.className='index-card';
  card.innerHTML=`<i class="index-thumb" style="background-image:url('assets/photos/${thumbs[i]}')"></i><span>${slide.dataset.title}</span>`;
  card.addEventListener('click',()=>{showSlide(i,'forward');toggleIndex(false)});
  indexGrid.append(card);
});
function toggleIndex(force){
  const open=typeof force==='boolean'?force:!index.classList.contains('open');
  index.classList.toggle('open',open);index.setAttribute('aria-hidden',String(!open));
}
document.getElementById('gridToggle').addEventListener('click',()=>toggleIndex());
document.getElementById('closeIndex').addEventListener('click',()=>toggleIndex(false));

const modal=document.getElementById('videoModal');
function toggleVideo(open){modal.classList.toggle('open',open);modal.setAttribute('aria-hidden',String(!open))}
document.getElementById('playFilm').addEventListener('click',()=>toggleVideo(true));
document.getElementById('closeVideo').addEventListener('click',()=>toggleVideo(false));

document.getElementById('fullscreen').addEventListener('click',()=>{
  if(!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
});

const blackout = document.getElementById('blackoutScreen');
function toggleBlackout(force){
  if(!blackout) return;
  const active = typeof force === 'boolean' ? force : !blackout.classList.contains('active');
  blackout.classList.toggle('active', active);
  blackout.setAttribute('aria-hidden', String(!active));
}
if(blackout) blackout.addEventListener('click', ()=>toggleBlackout(false));

document.addEventListener('keydown',event=>{
  if(blackout && blackout.classList.contains('active')){
    toggleBlackout(false);
    return;
  }
  const key = event.key;
  if(key==='ArrowRight'||key===' '||key==='PageDown'||key==='ArrowDown'||key==='Enter'||key==='n'||key==='N'){
    event.preventDefault();next();
  } else if(key==='ArrowLeft'||key==='PageUp'||key==='ArrowUp'||key==='Backspace'||key==='p'||key==='P'){
    event.preventDefault();prev();
  } else if(key==='Home'){
    event.preventDefault();showSlide(0,'backward');
  } else if(key==='End'){
    event.preventDefault();showSlide(slides.length-1,'forward');
  } else if(key.toLowerCase()==='m'){
    toggleIndex();
  } else if(key.toLowerCase()==='f'){
    document.getElementById('fullscreen').click();
  } else if(key.toLowerCase()==='b'||key==='.'){
    event.preventDefault();toggleBlackout();
  } else if(key==='Escape'){
    toggleIndex(false);toggleVideo(false);toggleBlackout(false);
  }
});

window.addEventListener('hashchange', () => {
  const hashNum = Number(location.hash.slice(1));
  if (!isNaN(hashNum) && hashNum >= 1 && hashNum <= slides.length && hashNum - 1 !== current) {
    showSlide(hashNum - 1, hashNum - 1 > current ? 'forward' : 'backward');
  }
});

let touchX=0;
deck.addEventListener('touchstart',e=>touchX=e.changedTouches[0].screenX,{passive:true});
deck.addEventListener('touchend',e=>{const delta=e.changedTouches[0].screenX-touchX;if(Math.abs(delta)>60)(delta<0?next:prev)()},{passive:true});
deck.addEventListener('pointermove',e=>{
  const rect=deck.getBoundingClientRect();
  const x=(e.clientX-rect.left)/rect.width-.5;
  const y=(e.clientY-rect.top)/rect.height-.5;
  document.documentElement.style.setProperty('--mx',(x*80).toFixed(1));
  document.documentElement.style.setProperty('--my',(y*80).toFixed(1));
});

window.addEventListener('resize',fitDeck);
fitDeck();
const initial=Math.max(0,Math.min(slides.length-1,Number(location.hash.slice(1)||1)-1));
current=-1;showSlide(initial);

