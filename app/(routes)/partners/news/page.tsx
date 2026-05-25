import type { ComponentProps } from 'react';
import { CorePartnersNewsScreen } from '../../../src/modules/core-partners';

export default function Page(props: ComponentProps<typeof CorePartnersNewsScreen>) {
  return <CorePartnersNewsScreen {...props} />;
}
