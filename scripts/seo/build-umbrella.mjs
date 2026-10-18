// Render the same shipped translations for people and crawlers; never branch on User-Agent.
import { parse, parseFragment, serialize } from 'parse5';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const origin = 'https://umbrella-home.saturnusgo.com';
const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
function setAttr(node, name, value) {
  const item = node.attrs.find(item => item.name === name);
  if (item) item.value = value; else node.attrs.push({name,value});
}
function visit(node, fn) { fn(node); for (const child of [...(node.childNodes ?? [])]) visit(child, fn); }
function appendHTML(node, html) {
  const fragment = parseFragment(html);
  for (const child of fragment.childNodes) {child.parentNode = node; node.childNodes.push(child);}
}
const safe = value => String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const urlFor = locale => `${origin}/${locale === 'ru' ? '' : `?lang=${locale}`}`;

export function renderUmbrella(template, catalogs, locales, locale) {
  const document = parse(template);
  const copy = key => catalogs[locale][key] ?? catalogs.ru[key] ?? key;
  let head;
  visit(document, node => {
    if (node.tagName === 'html') setAttr(node,'lang',locale);
    if (node.tagName === 'head') head = node;
    const key = attr(node,'data-i18n');
    if (key) {
      // Keep the original arrows, icons and child controls, just as the client translation does.
      const own = node.childNodes.filter(child => child.nodeName === '#text');
      const target = own.find(child => child.value.trim()) ?? own[0];
      if (target) {
        target.value = copy(key);
        node.childNodes = node.childNodes.filter(child => child.nodeName !== '#text' || child === target);
      } else appendHTML(node,safe(copy(key)));
    }
    const htmlKey = attr(node,'data-i18n-html');
    if (htmlKey) {node.childNodes = []; appendHTML(node,copy(htmlKey));}
    for (const name of ['aria-label','alt','placeholder','content']) {
      const attributeKey = attr(node,`data-i18n-${name}`);
      if (attributeKey) setAttr(node,name,copy(attributeKey));
    }
  });
  if (!head) throw new Error('Landing template has no head');
  head.childNodes = head.childNodes.filter(node => !(
    (node.tagName === 'link' && ['canonical','alternate'].includes(attr(node,'rel'))) ||
    (node.tagName === 'meta' && (attr(node,'property')?.startsWith('og:') || attr(node,'name')?.startsWith('twitter:'))) ||
    attr(node,'id') === 'umbrella-product-schema'
  ));
  const graph = {'@context':'https://schema.org','@graph':[
    {'@type':'WebSite','@id':`${origin}/#website`,name:'Umbrella Home',alternateName:'Umbrella',url:`${origin}/`,inLanguage:locales},
    {'@type':'SoftwareApplication','@id':`${origin}/#software`,name:'Umbrella Home',alternateName:'Umbrella',url:`${origin}/`,
      description:copy('meta.description'),applicationCategory:'LifestyleApplication',creativeWorkStatus:'In development',
      image:`${origin}/assets/umbrella-brand.png`,creator:{'@type':'Person',name:'Mercury Rucks'},
      sameAs:['https://www.instagram.com/umbrella_home_official','https://x.com/saturnusgo']},
  ]};
  appendHTML(head, `<link rel="canonical" href="${safe(urlFor(locale))}">
    ${[...locales,'x-default'].map(lang => `<link rel="alternate" hreflang="${lang}" href="${safe(urlFor(lang === 'x-default' ? 'ru' : lang))}">`).join('\n')}
    <meta property="og:type" content="website"><meta property="og:site_name" content="Umbrella Home">
    <meta property="og:title" content="${safe(copy('meta.title'))}" data-i18n-content="meta.title">
    <meta property="og:description" content="${safe(copy('meta.description'))}" data-i18n-content="meta.description">
    <meta property="og:url" content="${safe(urlFor(locale))}"><meta property="og:locale" content="${{ru:'ru_RU',en:'en_US',es:'es_AR',pt:'pt_BR'}[locale]}">
    <meta property="og:image" content="${origin}/assets/umbrella-brand.png"><meta property="og:image:alt" content="Umbrella Home">
    <meta name="twitter:card" content="summary"><meta name="twitter:title" content="${safe(copy('meta.title'))}" data-i18n-content="meta.title">
    <meta name="twitter:description" content="${safe(copy('meta.description'))}" data-i18n-content="meta.description"><meta name="twitter:image" content="${origin}/assets/umbrella-brand.png">
    <script id="umbrella-product-schema" type="application/ld+json">${JSON.stringify(graph).replaceAll('<','\\u003c')}</script>`);
  return serialize(document);
}

export async function buildUmbrella(publicDirectory) {
  const directory = resolve(publicDirectory);
  const {localeCatalogs,supportedLocales} = await import(pathToFileURL(join(directory,'locales.js')).href);
  const template = await readFile(join(directory,'index.html'),'utf8');
  await mkdir(join(directory,'_seo'),{recursive:true});
  for (const locale of supportedLocales) {
    const html = renderUmbrella(template,localeCatalogs,supportedLocales,locale);
    await writeFile(join(directory,'_seo',`${locale}.html`),html);
    if (locale === 'ru') await writeFile(join(directory,'index.html'),html);
  }
  await writeFile(join(directory,'robots.txt'),`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /_seo/\nSitemap: ${origin}/sitemap.xml\n`);
  const alternates = [...supportedLocales,'x-default'].map(lang => `<xhtml:link rel="alternate" hreflang="${lang}" href="${safe(urlFor(lang === 'x-default' ? 'ru' : lang))}"/>`).join('');
  await writeFile(join(directory,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${supportedLocales.map(locale => `<url><loc>${safe(urlFor(locale))}</loc>${alternates}</url>`).join('')}</urlset>\n`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.argv[2]) throw new Error('Pass the reviewed Umbrella public directory');
  await buildUmbrella(process.argv[2]);
  console.log('Rendered Umbrella Home discovery files and four language documents.');
}
