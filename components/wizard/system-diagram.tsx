import { ArrowRight, BatteryCharging, Home, Sun, Zap } from 'lucide-react';

const nodes = [
  { label: 'Paneles', icon: Sun },
  { label: 'Regulador', icon: Zap },
  { label: 'Baterías', icon: BatteryCharging },
  { label: 'Inversor', icon: Zap },
  { label: 'Consumo', icon: Home },
];

export function SystemDiagram() {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-ink p-4 text-white">
      {nodes.map((node, index) => {
        const Icon = node.icon;
        return (
          <div key={node.label} className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
              <Icon className="size-4 text-solar" />
              <span className="text-xs font-semibold">{node.label}</span>
            </div>
            {index < nodes.length - 1 ? <ArrowRight className="size-3 text-white/30" /> : null}
          </div>
        );
      })}
    </div>
  );
}
