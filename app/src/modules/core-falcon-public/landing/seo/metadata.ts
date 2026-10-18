import type { Metadata } from 'next';
import { englishCopy, russianCopy } from '../localization/content/copy';
import type { LandingLocale } from '../localization/model/locale';

export const FALCON_ORIGIN = 'https://tms.saturnusgo.com';
export function falconLandingMetadata(locale: LandingLocale): Metadata {
  const copy = locale === 'ru' ? russianCopy : englishCopy;
  const url = `${FALCON_ORIGIN}${locale === 'ru' ? '/ru/' : '/'}`;
  const image = `${FALCON_ORIGIN}/falcon/landing/2026-10/hero-preview.png`;
  return {
    title: {absolute: copy.title}, description: copy.description,
    applicationName: 'Falcon TMS', robots: {index:true,follow:true},
    alternates: {canonical:url, languages:{en:`${FALCON_ORIGIN}/`,ru:`${FALCON_ORIGIN}/ru/`,'x-default':`${FALCON_ORIGIN}/`}},
    openGraph: {type:'website',title:copy.title,description:copy.description,url,siteName:'Falcon TMS',
      locale:locale === 'ru' ? 'ru_RU' : 'en_US', alternateLocale:locale === 'ru' ? 'en_US' : 'ru_RU',
      images:[{url:image,width:2512,height:1660,alt:'Falcon TMS test case repository and scenario'}]},
    twitter:{card:'summary_large_image',title:copy.title,description:copy.description,images:[image]},
    icons:{icon:'/falcon/falcon-mark-dark.png',apple:'/falcon/falcon-mark-dark.png'},
  };
}
export function falconStructuredData(locale: LandingLocale) {
  const copy = locale === 'ru' ? russianCopy : englishCopy;
  return {'@context':'https://schema.org','@graph':[
    {'@type':'WebSite','@id':`${FALCON_ORIGIN}/#website`,name:'Falcon TMS',alternateName:['Falcon','Falcon Test Management System'],
      url:`${FALCON_ORIGIN}/`,inLanguage:['en','ru'],description:copy.description},
    {'@type':'SoftwareApplication','@id':`${FALCON_ORIGIN}/#software`,name:'Falcon TMS',alternateName:'Falcon',
      url:`${FALCON_ORIGIN}/`,applicationCategory:'DeveloperApplication',operatingSystem:'Web browser',
      description:copy.description,image:`${FALCON_ORIGIN}/falcon/landing/2026-10/hero-preview.png`,
      featureList:['Test case repository','Shared test steps','Test runs and results','Defect tracking','Release readiness','API testing'],
      creator:{'@type':'Person',name:'Mercury Rucks'},sameAs:['https://t.me/falcon_tms']},
  ]};
}
