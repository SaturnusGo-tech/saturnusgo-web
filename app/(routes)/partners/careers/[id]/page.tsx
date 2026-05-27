import { CorePartnersCareerDetailScreen } from '../../../../src/modules/core-partners';
export { dynamic, dynamicParams, generateStaticParams } from '../../../../src/modules/core-partners/routes/careers/[id]/page';

export default function Page({ params }: { params: { id: string } }) {
  return <CorePartnersCareerDetailScreen params={params} />;
}
