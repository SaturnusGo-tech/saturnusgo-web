import type { ComponentProps } from 'react';
import { CorePartnersTermsScreen } from '../../../src/modules/core-partners';

export default function Page(props: ComponentProps<typeof CorePartnersTermsScreen>) {
  return <CorePartnersTermsScreen {...props} />;
}
