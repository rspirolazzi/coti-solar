import type { Metadata } from 'next';
import { SummaryStep } from '@/components/wizard/summary-step';

export const metadata: Metadata = { title: 'Resumen y presupuesto' };

export default function Page() {
  return <SummaryStep />;
}
