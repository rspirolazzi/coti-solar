'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MONTH_LABELS } from '@/domain/calculations';

export function RadiationChart({ values }: { values: number[] }) {
  const data = MONTH_LABELS.map((label, index) => ({
    label,
    hsp: Number(values[index] || 0),
  }));
  return (
    <div className="h-56 w-full" aria-label="Radiación media diaria por mes">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#E4DCCD" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
          <YAxis tickLine={false} axisLine={false} fontSize={11} width={36} />
          <Tooltip
            cursor={{ fill: 'rgba(246,168,28,0.08)' }}
            formatter={(value) => [`${Number(value).toFixed(2)} kWh/m²/día`, 'HSP']}
            labelStyle={{ color: '#0C2233' }}
            contentStyle={{ borderRadius: 12, borderColor: '#E4DCCD' }}
          />
          <Bar dataKey="hsp" fill="#F6A81C" radius={[6, 6, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
