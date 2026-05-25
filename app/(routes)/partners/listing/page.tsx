import type { ComponentProps } from 'react';
import { CorePartnersListingScreen } from '../../../src/modules/core-partners';

export default function Page(props: ComponentProps<typeof CorePartnersListingScreen>) {
  return <CorePartnersListingScreen {...props} />;
}
