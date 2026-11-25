import type { Metadata } from 'next';
import { ConsumptionStep } from '@/components/wizard/consumption-step';

export const metadata: Metadata = { title: 'Consumo y energía' };

export default function Page() {
  return <ConsumptionStep />;
}
