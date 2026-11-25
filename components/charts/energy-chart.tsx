'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MonthlyEnergy } from '@/domain/types';
import { formatNumber } from '@/lib/format';

export function EnergyChart({ data }: { data: MonthlyEnergy[] }) {
  return (
    <div className="h-64 w-full" aria-label="Generación y consumo por mes">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#E4DCCD" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={11}
            width={54}
            tickFormatter={(value) => formatNumber(Number(value), 0)}
          />
          <Tooltip
            formatter={(value, name) => [
              `${Number(value).toLocaleString('es-AR', { maximumFractionDigits: 0 })} Wh/día`,
              name === 'generationWhDay' ? 'Generación' : 'Consumo',
            ]}
            contentStyle={{ borderRadius: 12, borderColor: '#E4DCCD' }}
          />
          <Legend
            formatter={(value) => (value === 'generationWhDay' ? 'Generación' : 'Consumo')}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="demandWhDay" fill="#0C2233" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Bar
            dataKey="generationWhDay"
            fill="#F6A81C"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
