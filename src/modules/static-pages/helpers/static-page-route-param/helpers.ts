import { STATIC_PAGE_COPY } from '../../constants';

export function createRouteParamLabel(routeParam: string | undefined): string | null {
  if (!routeParam) {
    return null;
  }

  return `${STATIC_PAGE_COPY.dynamicParamPrefix}: ${routeParam}`;
}
