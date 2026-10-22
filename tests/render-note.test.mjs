import test from 'node:test';
import assert from 'node:assert/strict';
import { renderNote } from '../render-note.mjs';
const render = md => renderNote(md, { id: 'example' }, []).html;

test('YAML and YML are native, closed disclosures before JavaScript runs', () => {
 for (const language of ['yaml', 'YAML', 'yml', 'Yml']) {
  const html = render(`\`\`\`${language}\nsensor:\n  name: Example\n\`\`\``);
  assert.match(html, /<details class="code-wrap code-disclosure">/);
  assert.doesNotMatch(html, /<details[^>]*\bopen\b/);
  assert.match(html, /2 строки/);
  assert.match(html, /class="copy-code"/);
  assert.match(html, /sensor:\n  name: Example\n/);
 }
});

test('code characters are escaped once and never become markup', () => {
 const html = render('```yaml\nvalue: "<script> & ==literal== ->"\n```');
 assert.match(html, /&lt;script&gt; &amp; ==literal== -&gt;/);
 assert.doesNotMatch(html, /<script>|<mark>|&amp;lt;/);
});

test('YAML inside a callout gets its own closed disclosure', () => {
 const html = render('> [!note] Example\n>\n> ```yaml\n> key: value\n> ```');
 assert.match(html, /<aside class="callout">/);
 assert.match(html, /<details class="code-wrap code-disclosure">/);
 assert.match(html, /1 строка/);
 assert.match(html, /key: value/);
});

test('shell examples stay visible and obsolete TOC fences are omitted', () => {
 const html = render('```bash\nprintf "hello"\n```\n\n```table-of-contents\n```');
 assert.doesNotMatch(html, /<details|table-of-contents/);
 assert.equal((html.match(/class="copy-code"/g)||[]).length, 1);
 assert.match(html, /language-bash/);
});

test('standalone local screenshots become captioned figures with original image links', () => {
 const html=render('![Daily forecast](assets/images/weather/daily.png "Day & night")\n![Hourly forecast](assets/images/weather/hourly.png)');
 assert.match(html,/class="screenshot-gallery screenshot-pair"/);
 assert.equal((html.match(/<figure /g)||[]).length,2);
 assert.match(html,/<figcaption>Day &amp; night<\/figcaption>/);
 assert.match(html,/href="assets\/images\/weather\/daily.png"/);
 assert.match(html,/loading="lazy"/);
 assert.doesNotMatch(html,/<p><div/);
});

test('inline images retain paragraph structure and gallery captions escape markup', () => {
 assert.match(render('Text ![Icon](assets/images/icon.png) more text'),/^<p>/);
 const html=render('![Example](assets/images/example.png "<script>alert(1)</script>")');
 assert.doesNotMatch(html,/<script>/);
 assert.match(html,/&lt;script&gt;/);
 assert.doesNotMatch(render('![Remote](https://example.com/image.png)'),/screenshot-link/);
});

test('Gismeteo compact card pairs with its preceding paragraph, retaining the rest of the article', () => {
 const md='## Preview\n\nIntro text.\n\n![Card](assets/images/gismeteo/dashboard.png "Caption")\n\n## Setup\n\nInstructions.';
 const result=renderNote(md,{id:'gismeteo'},[]);
 assert.match(result.html,/<div class="image-aside"><div class="image-aside-text"><p>Intro text\.<\/p>/);
 assert.equal((result.html.match(/<figure /g)||[]).length,1);
 assert.match(result.html,/Instructions\./);
 assert.equal(result.toc.length,2);
 assert.doesNotMatch(result.html,/screenshot-zoom/);
 assert.doesNotMatch(renderNote(md,{id:'other'},[]).html,/image-aside/);
});
