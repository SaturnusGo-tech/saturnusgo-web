import type { StaticPageDescriptor, StaticPageMap } from '../../types';
import { STATIC_PAGE_KEYS } from '../static-page-keys/static-page-keys';

export const STATIC_PAGES: StaticPageMap = {
  [STATIC_PAGE_KEYS.home]: {
    key: STATIC_PAGE_KEYS.home,
    href: '/',
    title: 'Home',
    description: 'Empty shell for the public landing entry.',
  },
  [STATIC_PAGE_KEYS.changelog]: {
    key: STATIC_PAGE_KEYS.changelog,
    href: '/changelog',
    title: 'Changelog',
    description: 'Empty shell for product updates.',
  },
  [STATIC_PAGE_KEYS.faq]: {
    key: STATIC_PAGE_KEYS.faq,
    href: '/faq',
    title: 'FAQ',
    description: 'Empty shell for frequently asked questions.',
  },
  [STATIC_PAGE_KEYS.features]: {
    key: STATIC_PAGE_KEYS.features,
    href: '/features',
    title: 'Features',
    description: 'Empty shell for feature overview.',
  },
  [STATIC_PAGE_KEYS.founder]: {
    key: STATIC_PAGE_KEYS.founder,
    href: '/founder',
    title: 'Founder',
    description: 'Empty shell for founder story.',
  },
  [STATIC_PAGE_KEYS.investors]: {
    key: STATIC_PAGE_KEYS.investors,
    href: '/investors',
    title: 'Investors',
    description: 'Empty shell for investor materials.',
  },
  [STATIC_PAGE_KEYS.investorsMethodology]: {
    key: STATIC_PAGE_KEYS.investorsMethodology,
    href: '/investors/methodology',
    title: 'Investor methodology',
    description: 'Empty shell for methodology details.',
  },
  [STATIC_PAGE_KEYS.mobile]: {
    key: STATIC_PAGE_KEYS.mobile,
    href: '/mobile',
    title: 'Mobile',
    description: 'Empty shell for mobile app presentation.',
  },
  [STATIC_PAGE_KEYS.partners]: {
    key: STATIC_PAGE_KEYS.partners,
    href: '/partners',
    title: 'Partners',
    description: 'Empty shell for partner overview.',
  },
  [STATIC_PAGE_KEYS.partnersAbout]: {
    key: STATIC_PAGE_KEYS.partnersAbout,
    href: '/partners/about',
    title: 'Partners about',
    description: 'Empty shell for partner about page.',
  },
  [STATIC_PAGE_KEYS.partnersApply]: {
    key: STATIC_PAGE_KEYS.partnersApply,
    href: '/partners/apply',
    title: 'Partner application',
    description: 'Empty shell for partner application.',
  },
  [STATIC_PAGE_KEYS.partnersBenefitsPlatform]: {
    key: STATIC_PAGE_KEYS.partnersBenefitsPlatform,
    href: '/partners/benefits/platform',
    title: 'Partner platform benefits',
    description: 'Empty shell for platform benefits.',
  },
  [STATIC_PAGE_KEYS.partnersBenefitsReach]: {
    key: STATIC_PAGE_KEYS.partnersBenefitsReach,
    href: '/partners/benefits/reach',
    title: 'Partner reach benefits',
    description: 'Empty shell for reach benefits.',
  },
  [STATIC_PAGE_KEYS.partnersBenefitsTrusted]: {
    key: STATIC_PAGE_KEYS.partnersBenefitsTrusted,
    href: '/partners/benefits/trusted',
    title: 'Partner trust benefits',
    description: 'Empty shell for trusted benefits.',
  },
  [STATIC_PAGE_KEYS.partnersCareers]: {
    key: STATIC_PAGE_KEYS.partnersCareers,
    href: '/partners/careers',
    title: 'Partner careers',
    description: 'Empty shell for partner careers.',
  },
  [STATIC_PAGE_KEYS.partnersCareerDetail]: {
    key: STATIC_PAGE_KEYS.partnersCareerDetail,
    href: '/partners/careers/[id]',
    title: 'Partner career detail',
    description: 'Empty shell for partner career details.',
  },
  [STATIC_PAGE_KEYS.partnersCompliance]: {
    key: STATIC_PAGE_KEYS.partnersCompliance,
    href: '/partners/compliance',
    title: 'Partner compliance',
    description: 'Empty shell for partner compliance.',
  },
  [STATIC_PAGE_KEYS.partnersContacts]: {
    key: STATIC_PAGE_KEYS.partnersContacts,
    href: '/partners/contacts',
    title: 'Partner contacts',
    description: 'Empty shell for partner contacts.',
  },
  [STATIC_PAGE_KEYS.partnersCookies]: {
    key: STATIC_PAGE_KEYS.partnersCookies,
    href: '/partners/cookies',
    title: 'Partner cookies',
    description: 'Empty shell for partner cookie policy.',
  },
  [STATIC_PAGE_KEYS.partnersListing]: {
    key: STATIC_PAGE_KEYS.partnersListing,
    href: '/partners/listing',
    title: 'Partner listing',
    description: 'Empty shell for partner listing.',
  },
  [STATIC_PAGE_KEYS.partnersNews]: {
    key: STATIC_PAGE_KEYS.partnersNews,
    href: '/partners/news',
    title: 'Partner news',
    description: 'Empty shell for partner news.',
  },
  [STATIC_PAGE_KEYS.partnersPrivacy]: {
    key: STATIC_PAGE_KEYS.partnersPrivacy,
    href: '/partners/privacy',
    title: 'Partner privacy',
    description: 'Empty shell for partner privacy policy.',
  },
  [STATIC_PAGE_KEYS.partnersTerms]: {
    key: STATIC_PAGE_KEYS.partnersTerms,
    href: '/partners/terms',
    title: 'Partner terms',
    description: 'Empty shell for partner terms.',
  },
  [STATIC_PAGE_KEYS.press]: {
    key: STATIC_PAGE_KEYS.press,
    href: '/press',
    title: 'Press',
    description: 'Empty shell for press materials.',
  },
  [STATIC_PAGE_KEYS.pricing]: {
    key: STATIC_PAGE_KEYS.pricing,
    href: '/pricing',
    title: 'Pricing',
    description: 'Empty shell for pricing.',
  },
  [STATIC_PAGE_KEYS.support]: {
    key: STATIC_PAGE_KEYS.support,
    href: '/support',
    title: 'Support',
    description: 'Empty shell for support.',
  },
  [STATIC_PAGE_KEYS.topupCrypto]: {
    key: STATIC_PAGE_KEYS.topupCrypto,
    href: '/topup-crypto',
    title: 'Top up crypto',
    description: 'Empty shell for crypto top-up.',
  },
  [STATIC_PAGE_KEYS.notFound]: {
    key: STATIC_PAGE_KEYS.notFound,
    href: '/404',
    title: 'Not found',
    description: 'Empty shell for missing routes.',
  },
};

export const STATIC_PAGE_LIST: readonly StaticPageDescriptor[] = Object.values(STATIC_PAGES);
