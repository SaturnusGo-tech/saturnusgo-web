import type { ComponentProps } from 'react';
import { CorePartnersApplyScreen } from '../../../src/modules/core-partners';

export default function Page(props: ComponentProps<typeof CorePartnersApplyScreen>) {
  return <CorePartnersApplyScreen {...props} />;
}
