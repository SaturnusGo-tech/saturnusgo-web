import type { ComponentProps } from 'react';
import { CorePartnersContactsScreen } from '../../../src/modules/core-partners';

export default function Page(props: ComponentProps<typeof CorePartnersContactsScreen>) {
  return <CorePartnersContactsScreen {...props} />;
}
