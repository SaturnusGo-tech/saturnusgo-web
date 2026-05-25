import type { ComponentProps } from 'react';
import { CorePartnersComplianceScreen } from '../../../src/modules/core-partners';

export default function Page(props: ComponentProps<typeof CorePartnersComplianceScreen>) {
  return <CorePartnersComplianceScreen {...props} />;
}
