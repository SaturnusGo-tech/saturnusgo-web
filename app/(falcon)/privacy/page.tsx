import type { Metadata } from 'next';
import { FalconPrivacyPage } from '../../src/modules/core-falcon-public/privacy/FalconPrivacyPage';
export const metadata: Metadata = { title: { absolute: 'Falcon · Privacy policy' }, robots: { index: true, follow: true } };
export default function Page() { return <FalconPrivacyPage />; }
