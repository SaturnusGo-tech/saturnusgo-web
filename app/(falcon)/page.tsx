import { LandingDocument } from '../src/modules/core-falcon-public/landing/seo/LandingDocument';
import { falconLandingMetadata } from '../src/modules/core-falcon-public/landing/seo/metadata';
export const metadata = falconLandingMetadata('en');
export default function Page() { return <LandingDocument locale="en" />; }
