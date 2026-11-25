'use client';

import Link from 'next/link';
import { ArrowUpRight, BatteryCharging, Sun, Zap } from 'lucide-react';
import { calculateProject } from '@/domain/calculations';
import { useProject } from '@/lib/store';
import { formatCurrency, formatNumber } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function LiveSummary() {
  const project = useProject();
  const calculation = calculateProject(project);

  const items = [
    {
      label: 'Consumo máximo',
      value: `${formatNumber(calculation.consumption.maxWhDay, 0)} Wh/día`,
      icon: Zap,
    },
    {
      label: 'Potencia FV',
      value: `${formatNumber(calculation.panels.nominalW, 0)} W`,
      icon: Sun,
    },
    {
      label: 'Banco de baterías',
      value: `${formatNumber(calculation.battery.capacityAh, 0)} Ah`,
      icon: BatteryCharging,
    },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="bg-ink px-5 py-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-solar">Resumen en vivo</p>
        <p className="mt-1 truncate font-display text-lg font-semibold">{project.name}</p>
      </div>
      <CardContent className="space-y-3 pt-5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-start gap-3">
              <span className="rounded-lg bg-sand p-2 text-ink">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-panel">{item.label}</p>
                <p className="num text-sm font-semibold text-ink">{item.value}</p>
              </div>
            </div>
          );
        })}
        <div className="border-t border-line pt-3">
          <p className="text-xs text-panel">Inversión estimada</p>
          <p className="num text-xl font-bold text-ink">
            {formatCurrency(calculation.costs.total, calculation.costs.currency)}
          </p>
        </div>
        <Button asChild variant="secondary" className="w-full">
          <Link href="/calculadora/resumen">
            Ver resumen
            <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
