import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveLandingLocale, requestedLandingLocale, landingLanguageURL, landingLocaleBootstrap } from '../model/locale';
import { englishCopy, russianCopy } from '../content/copy';
import { runInNewContext } from 'node:vm';
import { falconLandingMetadata, falconStructuredData } from '../../seo/metadata';

test('a shared language URL takes precedence over saved or browser language', () => {
  assert.equal(resolveLandingLocale('en','en-US','ru'), 'ru');
  assert.equal(resolveLandingLocale('ru','ru-RU','en'), 'en');
  assert.equal(resolveLandingLocale('ru','en-US','invalid'), 'ru');
});
test('language navigation retains workflow, attribution and the requested section', () => {
  const url = landingLanguageURL('https://tms.saturnusgo.com/?view=workflow&utm_source=demo#cases-video','ru');
  assert.equal(url.pathname,'/ru/');
  assert.equal(url.search,'?view=workflow&utm_source=demo');
  assert.equal(url.hash,'#cases-video');
  assert.equal(landingLanguageURL(url.href,'en').pathname,'/');
  assert.equal(requestedLandingLocale('/ru/',''),'ru');
  assert.equal(requestedLandingLocale('/',''),'en');
  assert.equal(requestedLandingLocale('/','?lang=ru'),'ru');
});
test('the English canonical stays English with a saved Russian preference', () => {
  const html={dataset:{},lang:''};
  runInNewContext(landingLocaleBootstrap,{document:{documentElement:html},navigator:{language:'ru-RU'},
    localStorage:{getItem:()=> 'ru'},location:{pathname:'/',search:''},URLSearchParams});
  assert.equal(html.lang,'en');
});
test('the prepaint language respects a shared URL even with an opposite saved preference', () => {
  const html={dataset:{},lang:''};
  runInNewContext(landingLocaleBootstrap,{document:{documentElement:html},navigator:{language:'en-US'},
    localStorage:{getItem:()=> 'en'},location:{pathname:'/ru/',search:''},URLSearchParams});
  assert.equal(html.lang,'ru');
});
test('both search titles identify the complete product and its testing purpose', () => {
  assert.match(englishCopy.title, /Falcon TMS/);
  assert.match(englishCopy.title, /Test Management/i);
  assert.match(russianCopy.title, /Falcon TMS/);
  assert.match(russianCopy.title, /тестирован/);
});

test('social previews and structured data use the landing language product capture', () => {
  for (const locale of ['en', 'ru'] as const) {
    const expected = `https://tms.saturnusgo.com/falcon/landing/2026-11/${locale}/product-repository.webp`;
    const metadata = falconLandingMetadata(locale);
    const images = metadata.openGraph?.images as { url: string; width: number; height: number }[];
    assert.equal(images[0].url, expected);
    assert.equal(images[0].width, 3456);
    assert.equal(images[0].height, 2234);
    assert.deepEqual(metadata.twitter?.images, [expected]);
    assert.equal(falconStructuredData(locale)['@graph'][1].image, expected);
  }
});
