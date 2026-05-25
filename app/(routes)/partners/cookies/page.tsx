import type { ComponentProps } from 'react';
import { CorePartnersCookiesScreen } from '../../../src/modules/core-partners';

export default function Page(props: ComponentProps<typeof CorePartnersCookiesScreen>) {
  return <CorePartnersCookiesScreen {...props} />;
}
