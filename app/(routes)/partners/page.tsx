import type { ComponentProps } from 'react';
import { CorePartnersScreen } from '../../src/modules/core-partners';

export default function Page(props: ComponentProps<typeof CorePartnersScreen>) {
  return <CorePartnersScreen {...props} />;
}
