import type { Metadata } from 'next';
import { PanelsStep } from '@/components/wizard/panels-step';

export const metadata: Metadata = { title: 'Paneles solares' };

export default function Page() {
  return <PanelsStep />;
}
