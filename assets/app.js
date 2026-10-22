const $ = s => document.querySelector(s);
const theme = $('.theme-toggle');
function themeLabel(){theme.setAttribute('aria-label', document.documentElement.dataset.theme==='dark'?'Включить светлую тему':'Включить тёмную тему');}
themeLabel();
theme.addEventListener('click',()=>{const value=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=value;try{localStorage.setItem('ha-theme',value)}catch{}themeLabel()});
const toggle=$('.mobile-toggle');
const mobileQuery=window.matchMedia('(max-width: 1024px)');
function updateMenuAccess(){const open=document.body.classList.contains('menu-open');$('#sidebar').inert=mobileQuery.matches&&!open;$('#main').inert=mobileQuery.matches&&open}
mobileQuery.addEventListener('change',()=>menu(false));
updateMenuAccess();
let menuScrollY=0;
function menu(open){
 open=Boolean(open&&mobileQuery.matches);
 const wasOpen=document.body.classList.contains('menu-open');
 if(open&&!wasOpen){menuScrollY=window.scrollY;document.body.style.setProperty('--menu-scroll-top',`-${menuScrollY}px`)}
 document.body.classList.toggle('menu-open',open);
 toggle.setAttribute('aria-expanded',String(open));
 toggle.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');
 if(!open&&wasOpen){document.body.style.removeProperty('--menu-scroll-top');window.scrollTo({top:menuScrollY,behavior:'instant'});if(mobileQuery.matches)toggle.focus({preventScroll:true})}
 updateMenuAccess();
}
// Keep keyboard focus within the visible navigation while the drawer is open.
document.addEventListener('keydown',event=>{
 if(event.key!=='Tab'||!document.body.classList.contains('menu-open'))return;
 const focusable=[...document.querySelectorAll('.header a,.header button,#sidebar a,#sidebar summary')].filter(el=>el.getClientRects().length);
 const first=focusable[0],last=focusable.at(-1);
 if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
 else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
});
document.querySelectorAll('.mobile-toc a').forEach(link=>link.addEventListener('click',()=>{link.closest('details').open=false}));
toggle.addEventListener('click',()=>menu(!document.body.classList.contains('menu-open')));
$('.drawer-overlay').addEventListener('click',()=>menu(false));
document.addEventListener('keydown',e=>{if(e.key==='Escape')menu(false)});
const dialog=$('.search-dialog'),input=$('#search-input'),results=$('#search-results');
// The visual viewport shrinks when a phone's software keyboard opens.
function sizeSearchDialog(){if(window.visualViewport)dialog.style.setProperty('--search-viewport-height',`${window.visualViewport.height}px`)}
window.visualViewport?.addEventListener('resize',sizeSearchDialog);
sizeSearchDialog();
let entries=[],loaded=false,loading=false;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=s=>s.toLocaleLowerCase('ru').replaceAll('ё','е');
function renderResults(){
 if(!loaded)return;
 const q=normalize(input.value.trim());
 const words=q.split(/\s+/).filter(Boolean);
 const matches=entries.filter(p=>words.every(w=>normalize(p.title+' '+p.group+' '+p.text).includes(w))).sort((a,b)=>Number(normalize(b.title).includes(q))-Number(normalize(a.title).includes(q)));
 results.innerHTML=matches.length?`<div class="search-count">${q?'Найдено: '+matches.length:'Все заметки'}</div>`+matches.map(p=>`<a class="search-result" href="${p.id}.html"><small>${esc(p.group)}</small><strong>${esc(p.title)}</strong><p>${esc(p.description)}</p></a>`).join(''):'<div class="search-empty">Ничего не найдено. Попробуй другое название или слово из заметки.</div>';
}
async function openSearch(){
 menu(false);dialog.showModal();input.focus();
 if(loaded){renderResults();return}
 if(loading)return;
 loading=true;results.innerHTML='<div class="search-empty">Загружаем заметки…</div>';
 try{const r=await fetch('search.json');if(!r.ok)throw new Error('index');entries=await r.json();loaded=true;renderResults()}catch{results.innerHTML='<div class="search-empty">Не удалось загрузить поиск. Закрой окно и попробуй ещё раз.</div>'}finally{loading=false}
}
$('.search-trigger').addEventListener('click',openSearch);
$('.close-search').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close()}});
input.addEventListener('input',renderResults);
input.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();results.querySelector('a')?.focus()}if(e.key==='Enter'){const a=results.querySelector('a');if(a){e.preventDefault();a.click()}}});
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(!dialog.open)openSearch()}if(e.key==='/'&&!dialog.open&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();openSearch()}});
document.querySelectorAll('.prose table').forEach(t=>{const wrap=document.createElement('div');wrap.className='table-scroll';t.before(wrap);wrap.append(t)});
document.querySelectorAll('.copy-code').forEach(button=>{
 const code=button.closest('.code-wrap').querySelector('pre code');
 const feedback=button.parentElement.querySelector('.copy-feedback');
 button.addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(code.textContent);button.textContent='Скопировано';feedback.textContent='Код скопирован';setTimeout(()=>{button.textContent='Копировать';feedback.textContent=''},1800)}
  catch{feedback.textContent='Не удалось скопировать. Выделите код вручную.'}
 });
});
const tocLinks=[...document.querySelectorAll('.toc nav a')];
const observer=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting){tocLinks.forEach(a=>a.classList.toggle('current',a.hash==='#'+e.target.id));break}}},{rootMargin:'-80px 0px -65% 0px'});
tocLinks.forEach(a=>{const t=document.getElementById(a.hash.slice(1));if(t)observer.observe(t)});
// Filter a catalogue by the author's recorded status.
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
 const value=button.dataset.filter;
 document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 document.querySelectorAll('.article-list-item').forEach(item=>item.hidden=value!=='all'&&item.dataset.status!==value);
 document.querySelectorAll('.collection-group').forEach(group=>group.hidden=![...group.querySelectorAll('.article-list-item')].some(item=>!item.hidden));
 const empty=document.querySelector('.filter-empty');if(empty)empty.hidden=[...document.querySelectorAll('.article-list-item')].some(item=>!item.hidden);
}));
// Keep bookmarks into the former long wiki useful after splitting it into pages.
if(location.pathname.endsWith('/ha-wiki.html')&&location.hash){
 let oldAnchor;try{oldAnchor=decodeURIComponent(location.hash.slice(1))}catch{oldAnchor=''}
 if(oldAnchor&&!document.getElementById(oldAnchor))fetch('wiki-redirects.json').then(r=>r.json()).then(map=>{if(map[oldAnchor])location.replace(map[oldAnchor])}).catch(()=>{});
}

// The original image link remains usable without JavaScript.
const screenshots=[...document.querySelectorAll('.screenshot-link')];
if(screenshots.length){
 const viewer=document.createElement('dialog');
 viewer.className='image-viewer';viewer.setAttribute('aria-label','Просмотр скриншота');
 viewer.innerHTML='<div class="image-viewer-toolbar"><p id="image-caption"></p><button type="button" class="image-close" aria-label="Закрыть скриншот">Закрыть ×</button></div><div class="image-viewer-stage"><img alt=""></div>';
 viewer.setAttribute('aria-describedby','image-caption');document.body.append(viewer);
 const photo=viewer.querySelector('img'),caption=viewer.querySelector('p');
 screenshots.forEach(link=>link.addEventListener('click',event=>{
  if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();photo.src=link.href;photo.alt=link.querySelector('img').alt;
  caption.textContent=link.closest('figure').querySelector('figcaption').textContent;
  viewer.showModal();
 }));
 photo.addEventListener('click',()=>viewer.close());
 viewer.querySelector('.image-close').addEventListener('click',()=>viewer.close());
 viewer.addEventListener('click',event=>{if(event.target===viewer){const box=viewer.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)viewer.close()}});
 // Keep global search shortcuts from opening a second modal above an image.
 document.addEventListener('keydown',event=>{if(viewer.open&&((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'||event.key==='/')){event.preventDefault();event.stopImmediatePropagation()}},true);
}
