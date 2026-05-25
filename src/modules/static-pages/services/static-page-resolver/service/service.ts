import { STATIC_PAGE_COPY, STATIC_PAGE_LIST, STATIC_PAGES } from '../../../constants';
import { createRouteParamLabel } from '../../../helpers';
import type { StaticPageKey, StaticPageViewModel } from '../../../types';

export function resolveStaticPage(
  pageKey: StaticPageKey,
  routeParam?: string,
): StaticPageViewModel {
  const descriptor = STATIC_PAGES[pageKey];

  return {
    ...descriptor,
    status: STATIC_PAGE_COPY.routeStatus,
    navigationTitle: STATIC_PAGE_COPY.navigationTitle,
    navigationHint: STATIC_PAGE_COPY.navigationHint,
    navigation: STATIC_PAGE_LIST,
    routeParamLabel: createRouteParamLabel(routeParam),
  };
}
