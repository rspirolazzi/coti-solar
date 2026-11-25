import type { Metadata } from 'next';
import { BatteryStep } from '@/components/wizard/battery-step';

export const metadata: Metadata = { title: 'Banco de baterías' };

export default function Page() {
  return <BatteryStep />;
}
