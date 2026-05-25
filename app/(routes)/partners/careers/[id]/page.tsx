import type { ComponentProps } from 'react';
import { CorePartnersCareerDetailScreen } from '../../../../src/modules/core-partners';
export { dynamic, dynamicParams, generateStaticParams } from '../../../../src/modules/core-partners/routes/careers/[id]/page';

export default function Page(props: ComponentProps<typeof CorePartnersCareerDetailScreen>) {
  return <CorePartnersCareerDetailScreen {...props} />;
}
