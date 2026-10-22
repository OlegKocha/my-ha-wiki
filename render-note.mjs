import { Marked, marked } from 'marked';
const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plain = value => String(value).replace(/<[^>]*>/g,'').replace(/[*`_]/g,'').trim();
export const slug = text => plain(text).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu,'').trim().replace(/\s+/g,'-') || 'section';
export function renderNote(md,page,pages){
 const toc=[],unresolved=[];
 const topHeadings=marked.lexer(md).filter(t=>t.type==='heading');
 const minimum=Math.min(...topHeadings.map(t=>t.depth),2);
 const shift=minimum===1?1:topHeadings.length&&topHeadings.every(t=>t.depth>=3)?2-Math.min(...topHeadings.map(t=>t.depth)):0;
 const used=new Map();
 const renderer=new marked.Renderer();
 // An image-only Markdown paragraph becomes a captioned, keyboard-accessible gallery.
 renderer.paragraph=function(token){
  const pictures=token.tokens.filter(t=>t.type==='image');
  if(pictures.length&&token.tokens.every(t=>t.type==='image'||t.type==='text'&&!t.text.trim())&&pictures.every(t=>/^assets\/images\/[\w/-]+\.(png|jpe?g|webp)$/i.test(t.href))){
   return `<div class="screenshot-gallery${pictures.length>1?' screenshot-pair':''}">${pictures.map(t=>`<figure class="article-screenshot"><a class="screenshot-link" href="${escape(t.href)}" aria-label="Увеличить: ${escape(t.text)}"><img src="${escape(t.href)}" alt="${escape(t.text)}" loading="lazy" decoding="async"></a><figcaption>${escape(t.title||t.text)}</figcaption></figure>`).join('')}</div>`;
  }
  return marked.Renderer.prototype.paragraph.call(this,token);
 };
 // Typography applies only to prose tokens; commands and code stay verbatim.
 renderer.text=function(token){
  return marked.Renderer.prototype.text.call(this,{...token,text:token.text.replace(/ -> /g,' → ')});
 };
 renderer.link=function(token){
  if(/^https?:\/\//.test(token.href)&&token.text===token.href){
   const url=new URL(token.href);
   const host=url.hostname.replace(/^www\./,'');
   const label=host==='github.com'?`GitHub · ${url.pathname.split('/').filter(Boolean).slice(0,2).join(' / ')}`:host==='youtu.be'||host==='youtube.com'?'Видео на YouTube':`Материал на ${host}`;
   return marked.Renderer.prototype.link.call(this,{...token,title:token.href,tokens:[{type:'text',raw:label,text:label}]});
  }
  return marked.Renderer.prototype.link.call(this,token);
 };
 renderer.heading=function({tokens,depth,text}){
  const base=slug(text), count=used.get(base)||0;used.set(base,count+1);
  const id=base+(count?'-'+count:'');const level=Math.min(6,Math.max(2,depth+shift));
  if(level<=3)toc.push({id,text:plain(text),level});
  return `<h${level} id="${id}">${this.parser.parseInline(tokens)}</h${level}>`;
 };
 renderer.code=function(token){
  const language=(token.lang||'text').trim().split(/\s+/)[0].toLowerCase();
  if(language==='table-of-contents')return '';
  const code=marked.Renderer.prototype.code.call(this,token);
  const label=escape(language.toUpperCase());
  const toolbar=`<div class="code-toolbar"><span>${label}</span><button type="button" class="copy-code" aria-label="Копировать код">Копировать</button><span class="copy-feedback" role="status"></span></div>`;
  if(language==='yaml'||language==='yml'){
   const count=token.text.replace(/\n$/,'').split('\n').length;
   const suffix=count%10===1&&count%100!==11?'строка':count%10>=2&&count%10<=4&&(count%100<12||count%100>14)?'строки':'строк';
   return `<details class="code-wrap code-disclosure"><summary><span class="code-chevron" aria-hidden="true">›</span><span class="code-language">YAML</span><span class="code-size">${count} ${suffix}</span><span class="code-toggle"><span class="when-closed">Развернуть</span><span class="when-open">Свернуть</span></span></summary>${toolbar}${code}</details>`;
  }
  return `<div class="code-wrap">${toolbar}${code}</div>`;
 };
 renderer.html=({text})=>/^\s*<br\s*\/?>\s*$/i.test(text)?'<br>':escape(text);
 renderer.blockquote=function({text,tokens}){
  const callout=text.match(/^\[!(\w+)\]([+-])?\s*([^\n]*)(?:\n|$)/);
  if(!callout)return `<blockquote>${this.parser.parse(tokens)}</blockquote>`;
  const [,kind,fold,title]=callout;
  const body=this.parser.parse(marked.lexer(text.slice(callout[0].length)));
  const label=escape(title||({example:'Пример',note:'Заметка',warning:'Важно',tip:'Подсказка'}[kind.toLowerCase()]||kind));
  return fold?`<details class="callout" ${fold==='+'?'open':''}><summary>${label}</summary><div class="callout-content">${body}</div></details>`:`<aside class="callout"><div class="callout-title">${label}</div><div class="callout-content">${body}</div></aside>`;
 };
 const parser=new Marked({renderer,extensions:[{
  name:'imageAside',
  renderer(token){return `<div class="image-aside"><div class="image-aside-text">${this.parser.parse([token.copy])}</div>${this.parser.parse([token.picture])}</div>`;}
 },{
  name:'highlight',level:'inline',start:src=>src.indexOf('=='),
  tokenizer(src){const match=/^==([^=\n](?:[^\n]*?[^=\n])?)==(?!=)/.exec(src);if(match)return {type:'highlight',raw:match[0],tokens:this.lexer.inlineTokens(match[1])};},
  renderer(token){return `<mark>${this.parser.parseInline(token.tokens)}</mark>`;}
 },{
  name:'wikilink',level:'inline',start:src=>src.indexOf('[['),
  tokenizer(src){const match=/^\[\[([^\]\n]+)\]\]/.exec(src);if(match)return {type:'wikilink',raw:match[0],target:match[1]};},
  renderer(token){
   const [destination,alias]=token.target.split('|');const hash=destination.indexOf('#');
   const name=hash>=0?destination.slice(0,hash):destination;
   const heading=hash>=0?destination.slice(hash+1):'';
   const target=name?pages.find(p=>[p.sourceName,p.title,p.id,...(p.aliases||[]),p.sourceFile?.replace(/\.md$/,'')].includes(name.replace(/\.md$/,''))):page;
   const label=alias||heading||name;
   if(!target){unresolved.push(destination);return `<span class="unresolved-link">${escape(label)}</span>`}
   return `<a href="${target.id===page.id&&heading?'':target.id+'.html'}${heading?'#'+slug(heading):''}">${escape(label)}</a>`;
  }
 }]});
 const tokens=parser.lexer(md);
 // Pair weather articles' introductory copy with their compact dashboard image.
 // The source and Markdown export retain ordinary paragraphs and image syntax.
 if(['gismeteo','yandex-weather'].includes(page.id)){
  const index=tokens.findIndex(t=>t.type==='paragraph'&&t.tokens?.some(t=>t.type==='image'&&t.href===`assets/images/${page.id}/dashboard.png`));
  let previous=index-1;
  while(previous>=0&&tokens[previous].type==='space')previous--;
  if(index>=0&&tokens[previous]?.type==='paragraph'){
   tokens.splice(previous,index-previous+1,{type:'imageAside',copy:tokens[previous],picture:tokens[index]});
  }
 }
 const html=parser.parser(tokens);
 return {html,toc,unresolved};
}
