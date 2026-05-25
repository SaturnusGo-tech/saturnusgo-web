import { resolveStaticPage } from '../../../services';
import type { StaticPageScreenProps } from '../../../types';
import { BlankPage } from '../../../ui';

export function StaticPageScreen({ pageKey, routeParam }: StaticPageScreenProps) {
  const viewModel = resolveStaticPage(pageKey, routeParam);

  return <BlankPage viewModel={viewModel} />;
}
