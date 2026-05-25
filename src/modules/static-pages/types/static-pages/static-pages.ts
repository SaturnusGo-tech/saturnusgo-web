export type StaticPageKey =
  | 'home'
  | 'changelog'
  | 'faq'
  | 'features'
  | 'founder'
  | 'investors'
  | 'investorsMethodology'
  | 'mobile'
  | 'partners'
  | 'partnersAbout'
  | 'partnersApply'
  | 'partnersBenefitsPlatform'
  | 'partnersBenefitsReach'
  | 'partnersBenefitsTrusted'
  | 'partnersCareers'
  | 'partnersCareerDetail'
  | 'partnersCompliance'
  | 'partnersContacts'
  | 'partnersCookies'
  | 'partnersListing'
  | 'partnersNews'
  | 'partnersPrivacy'
  | 'partnersTerms'
  | 'press'
  | 'pricing'
  | 'support'
  | 'topupCrypto'
  | 'notFound';

export type StaticPageDescriptor = {
  readonly key: StaticPageKey;
  readonly href: string;
  readonly title: string;
  readonly description: string;
};

export type StaticPageMap = Readonly<Record<StaticPageKey, StaticPageDescriptor>>;

export type StaticPageNavigationItem = Pick<StaticPageDescriptor, 'href' | 'title'>;

export type StaticPageViewModel = StaticPageDescriptor & {
  readonly status: string;
  readonly navigationTitle: string;
  readonly navigationHint: string;
  readonly navigation: readonly StaticPageNavigationItem[];
  readonly routeParamLabel: string | null;
};

export type StaticPageScreenProps = {
  readonly pageKey: StaticPageKey;
  readonly routeParam?: string;
};

export type StaticPageDynamicRouteParams = {
  readonly id: string;
};

export type StaticPageDynamicRouteProps = {
  readonly params: StaticPageDynamicRouteParams;
};
