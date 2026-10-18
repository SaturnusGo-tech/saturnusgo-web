import { FalconLanding } from '../FalconLanding';
import { landingLocaleBootstrap, type LandingLocale } from '../localization/model/locale';
import { falconStructuredData } from './metadata';

export function LandingDocument({locale}: {locale:LandingLocale}) {
  return <>
    <script dangerouslySetInnerHTML={{__html:landingLocaleBootstrap}} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(falconStructuredData(locale)).replace(/</g,'\\u003c')}} />
    <FalconLanding initialLocale={locale} />
  </>;
}
