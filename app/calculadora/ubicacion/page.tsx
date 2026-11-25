import type { Metadata } from 'next';
import { LocationStep } from '@/components/wizard/location-step';

export const metadata: Metadata = { title: 'Ubicación y radiación' };

export default function Page() {
  return <LocationStep />;
}
