// app/founder/page.tsx
import type { Metadata } from 'next';
import FounderClient from '../../../ui/founder-client';

export const metadata: Metadata = {
  title: 'About the Founder — SaturnusGo',
  description:
    'Why this founder, why now, and why SaturnusGo is a new class of mobility & travel product.',
};

export default function Page() {
  return <FounderClient />;
}
