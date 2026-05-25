import type { ComponentProps } from 'react';
import { CorePartnersBenefitsPlatformScreen } from '../../../../src/modules/core-partners';

export default function Page(props: ComponentProps<typeof CorePartnersBenefitsPlatformScreen>) {
  return <CorePartnersBenefitsPlatformScreen {...props} />;
}
