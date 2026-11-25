import type { Metadata } from 'next';
import { EquipmentStep } from '@/components/wizard/equipment-step';

export const metadata: Metadata = { title: 'Regulador e inversor' };

export default function Page() {
  return <EquipmentStep />;
}
