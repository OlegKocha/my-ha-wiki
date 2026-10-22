import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { assertPublicContent } from './privacy.mjs';
import { renderNote } from './render-note.mjs';
const root = new URL('./', import.meta.url);
const read = p => readFile(new URL(p, root), 'utf8');
const groups = JSON.parse(await read('content/catalog.json'));
const site = JSON.parse(await read('content/site.json'));
const statuses = site.statusLabels;
const pages = groups.flatMap(g => g.pages.map(p => ({...p, group:g.title, subgroup:g.subgroups?.find(x=>x.pageIds.includes(p.id))?.title})));
const articles = pages.filter(p=>p.kind!=='collection');
const plural = (n, one, few, many) => n%100>=11&&n%100<=14?many:n%10===1?one:n%10>=2&&n%10<=4?few:many;
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths = {
 home:'M3 10 12 3l9 7M5 9v12h14V9M9 21v-8h6v8',
 server:'M4 3h16v7H4zM4 14h16v7H4zM7 6h.01M7 17h.01M11 6h6M11 17h6',
 network:'M9 3h6v6H9zM3 15h6v6H3zM15 15h6v6h-6zM12 9v3M6 15v-3h12v3',
 bolt:'m13 2-9 12h7l-1 8 10-12h-7l1-8',
 layout:'M3 4h18v16H3zM3 9h18M9 9v11',
 tool:'m14 6 4 4M4 20l6-6M14 3a6 6 0 0 0-6 8L2 17l5 5 6-6a6 6 0 0 0 8-8l-4 4-5-5 4-4z',
 shield:'m12 3 9 4v5c0 5-9 9-9 9S3 17 3 12V7zM8 12l3 3 5-6',
 search:'m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
 moon:'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11',
 arrow:'M5 12h14m-5-5 5 5-5 5', chevron:'m9 5 7 7-7 7', menu:'M4 6h16M4 12h16M4 18h16',file:'M6 3h8l4 4v14H6zM14 3v5h5M9 12h6M9 16h6'
};
const icon = (name, cls='') => `<svg class="icon ${cls}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[name] || paths.file}"/></svg>`;
const statusHint = p => p.status==='verified' ? 'Отмечено автором как проверенное' : 'Личная проверка ещё не отмечена';
const statusBadge = p => p.status ? `<span class="status-badge status-${p.status}" title="${statusHint(p)}">${esc(statuses[p.status])}</span>` : '';
const githubBadge = p => p.repository ? `<a class="github-badge" href="${esc(p.repository)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(p.title)}: проект на GitHub (в новой вкладке)" title="${esc(p.repository.replace('https://github.com/',''))}"><svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .75a11.25 11.25 0 0 0-3.558 21.923c.563.104.768-.244.768-.542 0-.267-.01-.975-.015-1.914-3.13.68-3.791-1.508-3.791-1.508-.512-1.3-1.25-1.646-1.25-1.646-1.022-.699.078-.685.078-.685 1.13.08 1.725 1.16 1.725 1.16 1.005 1.722 2.638 1.225 3.28.937.102-.729.393-1.225.715-1.507-2.499-.284-5.126-1.25-5.126-5.566 0-1.23.44-2.234 1.16-3.022-.117-.284-.503-1.43.11-2.98 0 0 .945-.303 3.094 1.154A10.79 10.79 0 0 1 12 6.175c.956.004 1.919.13 2.818.38 2.148-1.457 3.091-1.154 3.091-1.154.615 1.55.229 2.696.113 2.98.722.788 1.158 1.792 1.158 3.022 0 4.327-2.631 5.279-5.138 5.557.404.35.766 1.041.766 2.098 0 1.515-.014 2.737-.014 3.108 0 .3.203.65.774.54A11.252 11.252 0 0 0 12 .75Z"/></svg>GitHub</a>` : '';
const statusDot = p => p.status ? `<span class="nav-status status-${p.status}" role="img" aria-label="${esc(statuses[p.status])}" title="${esc(statuses[p.status])}"></span>` : '';
function navLink(p,active,parentActive=false){return `<a href="${p.id}.html" class="${p.id===active||parentActive?'active':''}" ${p.id===active?'aria-current="page"':''}><span>${esc(p.title)}</span>${statusDot(p)}</a>`;}
function nav(active){
 return `<a class="nav-home ${active==='index'?'active':''}" href="index.html" ${active==='index'?'aria-current="page"':''}>${icon('home')}Главная</a><div class="nav-label">БИБЛИОТЕКА</div>`+groups.map((g,i)=>{
  const current=g.pages.some(p=>p.id===active);
  const nestedIds=(g.subgroups||[]).flatMap(x=>x.pageIds);
  const direct=g.navigationIds?g.navigationIds.map(id=>g.pages.find(p=>p.id===id)):g.pages.filter(p=>!nestedIds.includes(p.id));
  return `<details class="nav-group" ${current?'open':''}><summary>${icon(g.icon)}<span>${esc(g.title)}</span>${icon('chevron','chevron')}</summary><div class="nav-children">${direct.map(p=>navLink(p,active,current&&g.navigationIds&&!g.navigationIds.includes(active)&&p.id===g.navigationParentId)).join('')}${(g.subgroups||[]).map(sub=>`<details class="nav-subgroup" ${sub.pageIds.includes(active)?'open':''}><summary><span>${esc(sub.title)}</span>${icon('chevron','chevron')}</summary><div class="nav-children">${sub.pageIds.map(id=>navLink(g.pages.find(p=>p.id===id),active)).join('')}</div></details>`).join('')}</div></details>`;
 }).join('');
}
function collectionGroups(page){
 if(page.collection==='hacs')return [{title:'Дополнения',items:pages.filter(p=>site.hacsTopicIds.includes(p.id))}];
 const group=groups.find(g=>g.pages.some(p=>p.id===page.id));
 const nestedIds=(group.subgroups||[]).flatMap(x=>x.pageIds);
 return [{title:'Основные темы',items:group.pages.filter(p=>p.kind!=='collection'&&!nestedIds.includes(p.id))},...(group.subgroups||[]).map(sub=>({title:sub.title,items:group.pages.filter(p=>sub.pageIds.includes(p.id))}))].filter(g=>g.items.length);
}
function articleList(items){return `<div class="article-list">${items.map(p=>`<a class="article-list-item" href="${p.id}.html" data-status="${p.status}"><div class="article-list-title"><h3>${esc(p.title)}</h3>${statusBadge(p)}</div><p>${esc(p.description)}</p><span class="article-list-arrow" aria-hidden="true">→</span></a>`).join('')}</div>`;}
function collectionContent(p){
 const grouped=collectionGroups(p);
 const items=grouped.flatMap(g=>g.items);
 const filters=`<div class="status-filters" role="group" aria-label="Фильтр по статусу"><button data-filter="all" aria-pressed="true">Все <span>${items.length}</span></button><button data-filter="verified" aria-pressed="false">Проверено <span>${items.filter(x=>x.status==='verified').length}</span></button><button data-filter="needs-test" aria-pressed="false">Нужно проверить <span>${items.filter(x=>x.status==='needs-test').length}</span></button></div>`;
 return `<div class="collection-intro"><p>${p.collection==='hacs'?'Интеграции, карточки и дополнения для Home Assistant: что пригодилось, как настроить и что ещё предстоит попробовать.':'Настройка Home Assistant и материалы этого раздела. Выберите тему, чтобы открыть инструкцию.'}</p></div>${filters}<div class="collection-groups">${grouped.map((g,i)=>`<section class="collection-group" id="topic-group-${i}"><h2>${esc(g.title)}</h2>${articleList(g.items)}</section>`).join('')}</div><p class="filter-empty" hidden>В этом разделе пока нет заметок с таким статусом.</p>`;
}
function exportsFor(id, cls=''){return `<div class="export-actions ${cls}" aria-label="Экспорт статьи"><a href="content/${id}.md" download>${icon('file')}Скачать Markdown</a></div>`;}
function shell({id='index',title='Заметки об умном доме',group,subgroup,kind,body,toc=[]}){return `<!doctype html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="color-scheme" content="light dark"><title>${esc(title)} · My Home Assistant Wiki</title><meta name="description" content="Личная библиотека заметок о Home Assistant"><link rel="icon" href="assets/home-assistant.svg" type="image/svg+xml"><script>try{document.documentElement.dataset.theme=localStorage.getItem('ha-theme')||'light'}catch{}</script><link rel="stylesheet" href="assets/style.css"><script defer src="assets/app.js"></script></head><body>
<a class="skip" href="#main">К содержимому</a>
<header class="header"><div class="header-inner"><button class="icon-button mobile-toggle" aria-label="Открыть меню" aria-expanded="false" aria-controls="sidebar">${icon('menu')}</button><a class="brand" href="index.html" aria-label="My Home Assistant Wiki"><strong>My <img class="ha-logo" src="assets/home-assistant.svg" alt="Home Assistant" width="32" height="32"> Wiki</strong></a><button class="search-trigger" aria-label="Поиск по заметкам">${icon('search')}<span>Поиск по заметкам</span><kbd>⌘ K</kbd></button><button class="icon-button theme-toggle" aria-label="Переключить тему" title="Переключить тему">${icon('moon')}</button></div></header>
<div class="layout"><aside class="sidebar" id="sidebar" aria-label="Навигация по заметкам"><div class="sidebar-heading">Моя база знаний<span>HOME ASSISTANT</span></div><nav>${nav(id)}</nav><div class="sidebar-bottom"><span class="status-dot"></span>${process.env.SITE_ENV==='production'?'База знаний':'Локальный предпросмотр'}<small>${articles.length} ${plural(articles.length,'заметка','заметки','заметок')}</small></div></aside><button class="drawer-overlay" aria-label="Закрыть меню"></button>
<main id="main" tabindex="-1"><div class="breadcrumbs"><a href="index.html">База знаний</a><span>/</span>${group?group==='HACS'&&id!=='hacs'?`<a href="hacs.html">Полезные дополнения</a>`:`<span>${esc(group)}</span>`:'<span>Главная</span>'}${subgroup?`<span>/</span><span>${esc(subgroup)}</span>`:''}</div>${body}<footer class="page-footer"><span>My Home Assistant Wiki</span><span>Личная библиотека Home Assistant</span></footer></main>
<aside class="toc" aria-label="Оглавление">${toc.length?`<div class="toc-title">На этой странице</div><nav>${toc.map(t=>`<a class="toc-level-${t.level||2}" href="#${t.id}">${esc(t.text)}</a>`).join('')}</nav>`:""}${id!=='index'&&kind!=='collection'?exportsFor(id):''}</aside></div>
<dialog class="search-dialog"><div class="search-input-wrap">${icon('search')}<input type="search" id="search-input" aria-label="Поиск по заметкам" placeholder="Название, устройство или фрагмент…" autocomplete="off"><button class="close-search" aria-label="Закрыть поиск">Esc</button></div><div id="search-results" aria-live="polite"></div><div class="search-footer">Поиск по названиям и содержимому<span>Esc — закрыть</span></div></dialog>
</body></html>`;}
const markdownById=new Map();
const revisions=JSON.parse(await read('content/revisions.json'));
const now=new Date().toISOString();
for(const p of pages){
 if(p.repository&&!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(p.repository))throw new Error(`Invalid repository for ${p.id}`);
 const markdown=await read(`content/${p.id}.md`);
 assertPublicContent(markdown,p.id);
 assertPublicContent(JSON.stringify({title:p.title,description:p.description}),p.id);
 markdownById.set(p.id,markdown);
 const fingerprint=createHash('sha256').update(JSON.stringify({title:p.title,description:p.description,status:p.status,group:p.group,subgroup:p.subgroup,...(p.repository?{repository:p.repository}:{}),markdown})).digest('hex');
 const prior=revisions[p.id];
 revisions[p.id]={createdAt:prior?.createdAt||now,updatedAt:prior?.fingerprint===fingerprint?prior.updatedAt:now,fingerprint};
}
for(const id of Object.keys(revisions))if(!pages.some(p=>p.id===id))delete revisions[id];
await writeFile(new URL('content/revisions.json',root),JSON.stringify(revisions,null,2)+'\n');
const recentArticles=[...articles].sort((a,b)=>revisions[b.id].updatedAt.localeCompare(revisions[a.id].updatedAt)||revisions[b.id].createdAt.localeCompare(revisions[a.id].createdAt)||a.id.localeCompare(b.id)).slice(0,5);
const dateLabel=value=>new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',year:'numeric',timeZone:'Europe/Moscow'}).format(new Date(value));
// dist is generated output only. Rebuild it to avoid retaining removed demo pages.
await rm(new URL('dist/',root),{recursive:true,force:true});
await mkdir(new URL('dist/assets/',root),{recursive:true});
await mkdir(new URL('dist/content/',root),{recursive:true});
await cp(new URL('assets/',root),new URL('dist/assets/',root),{recursive:true});
for(const p of pages)await cp(new URL(`content/${p.id}.md`,root),new URL(`dist/content/${p.id}.md`,root));
const sectionCards = groups.map(g=>`<a class="section-card" href="${g.pages[0].id}.html"><span class="section-icon">${icon(g.icon)}</span><div><h3>${esc(g.title)}</h3><p>${esc(g.description)}</p><small>${g.pages.filter(p=>p.kind!=='collection').length} ${plural(g.pages.filter(p=>p.kind!=='collection').length,'статья','статьи','статей')}</small></div>${icon('arrow','card-arrow')}</a>`).join('');
const home = `<div class="hero"><div class="eyebrow">ЛИЧНАЯ БАЗА ЗНАНИЙ</div><h1>Заметки об умном доме<span class="title-dot">.</span></h1><p class="lead">Как всё устроено, что настроено и почему.<br>Инструкции и находки, к которым удобно возвращаться.</p><div class="hero-meta"><span>${icon('file')}${articles.length} ${plural(articles.length,'статья','статьи','статей')}</span><span>${icon('network')}${groups.length} ${plural(groups.length,'раздел','раздела','разделов')}</span></div></div>
<section id="sections"><div class="section-heading"><h2>По разделам</h2><span>От общей картины к деталям</span></div><div class="section-grid">${sectionCards}</div></section>
<section class="feature" id="start"><div class="feature-symbol">${icon('server')}</div><div><span class="small-label">ТОЧКА ВХОДА</span><h2>HACS: полезные находки</h2><p>Интеграции и карточки для своего дома.<br>Проверенные решения и идеи на пробу.</p><a href="hacs.html">Открыть полезные дополнения ${icon('arrow')}</a></div><div class="mini-map" aria-hidden="true"><span>Интеграции</span><i></i><strong>HA</strong><i></i><span>Карточки</span></div></section>
<section id="reading"><div class="section-heading"><h2>Последние изменения</h2><span>Добавленные и обновлённые заметки</span></div><div class="reading-list">${recentArticles.map(p=>{return `<a href="${p.id}.html">${icon('file')}<div><strong>${p.title}</strong><span>${p.group} · <time datetime="${revisions[p.id].updatedAt}">${dateLabel(revisions[p.id].updatedAt)}</time></span></div>${statusBadge(p)}${icon('arrow')}</a>`}).join('')}</div></section>`;
await writeFile(new URL('dist/index.html',root),shell({body:home,toc:[{id:'sections',text:'По разделам'},{id:'start',text:'Полезные дополнения'},{id:'reading',text:'Последние изменения'}]}));
const search=[];
for(const [i,p] of pages.entries()){
 const md=markdownById.get(p.id);
 const {html:rendered,toc:noteToc,unresolved}=renderNote(md,p,pages);
 const isCollection=p.kind==='collection';
 const article=isCollection?collectionContent(p):rendered;
 const toc=isCollection?collectionGroups(p).map((g,i)=>({id:`topic-group-${i}`,text:g.title})):noteToc;
 if(unresolved.length)throw new Error(`Unresolved wikilinks in ${p.id}: ${unresolved.join(', ')}`);
 const groupPages=groups.find(g=>g.title===p.group).pages;
 const groupIndex=groupPages.findIndex(x=>x.id===p.id);
 const prev=groupPages[groupIndex-1],next=groupPages[groupIndex+1];
 const body=`<article><div class="article-head"><span class="eyebrow">${esc(p.group)}</span><div class="article-title-row"><h1>${esc(p.title)}</h1><div class="article-actions">${githubBadge(p)}${statusBadge(p)}</div></div>${isCollection?"":`<div class="article-meta"><span>${Math.max(1,Math.ceil(md.split(/\s+/).length/150))} мин чтения</span></div>`}${isCollection?"":exportsFor(p.id,"article-exports")}</div>${toc.length?`<details class="mobile-toc"><summary>На этой странице ${icon('chevron','chevron')}</summary><nav aria-label="Разделы статьи">${toc.map(t=>`<a href="#${t.id}">${esc(t.text)}</a>`).join('')}</nav></details>`:''}<div class="${isCollection?"collection":"prose"}">${article}</div></article><nav class="page-navigation" aria-label="Соседние статьи">${prev?`<a href="${prev.id}.html"><small>← Предыдущая статья</small><strong>${prev.title}</strong></a>`:'<span></span>'}${next?`<a href="${next.id}.html"><small>Следующая статья →</small><strong>${next.title}</strong></a>`:''}</nav>`;
 await writeFile(new URL(`dist/${p.id}.html`,root),shell({...p,body,toc}));
 search.push({id:p.id,title:p.title,group:p.group,description:p.description,status:p.status,text:md.replace(/[#*`>|]/g,'')});
}
await cp(new URL('content/wiki-redirects.json',root),new URL('dist/wiki-redirects.json',root));
await writeFile(new URL('dist/search.json',root),JSON.stringify(search));
for(const [oldId,target] of Object.entries(site.redirects||{})){
 if(!pages.some(p=>p.id===target))throw new Error(`Unknown redirect target: ${target}`);
 await writeFile(new URL(`dist/${oldId}.html`,root),`<!doctype html><html lang="ru"><meta charset="utf-8"><script>location.replace(${JSON.stringify(target+'.html')}+location.hash)</script><noscript><meta http-equiv="refresh" content="0;url=${target}.html"></noscript><title>Статья перенесена</title><link rel="canonical" href="${target}.html"><p>Статья перенесена: <a href="${target}.html">открыть объединённую инструкцию</a>.</p></html>`);
}
console.log(`Built ${pages.length+1} pages and ${Object.keys(site.redirects||{}).length} redirects in dist/`);
