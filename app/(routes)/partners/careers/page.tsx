import type { ComponentProps } from 'react';
import { CorePartnersCareersScreen } from '../../../src/modules/core-partners';

export default function Page(props: ComponentProps<typeof CorePartnersCareersScreen>) {
  return <CorePartnersCareersScreen {...props} />;
}
