// Server component — metadata is valid here.
import MethodologyClient from '../../../ui/methodology-client';

export const metadata = {
  title: 'Methodology — Investor View (2025)',
  description:
    'Clear, investor-grade revenue methodology: Users × ARPU (net) × Take Rate → TOTAL → Non-ride share → Streams.',
};

export default function Page({ searchParams }: { searchParams?: { h?: string } }) {
  const h = searchParams?.h === '5' ? '5' : searchParams?.h === '10' ? '10' : '3';
  return <MethodologyClient initialH={h} />;
}
