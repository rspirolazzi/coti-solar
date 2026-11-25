'use client';

import { BatteryCharging, Zap } from 'lucide-react';
import { StepPage } from '@/components/wizard/step-page';
import { Field, Input, NumberInput, Select } from '@/components/ui/field';
import { calculateBattery, calculatePanels, suggestedVoltage } from '@/domain/calculations';
import { useProject, useProjectStore } from '@/lib/store';
import { formatNumber } from '@/lib/format';

export function BatteryStep() {
  const project = useProject();
  const updateProject = useProjectStore((state) => state.updateProject);
  const panels = calculatePanels(project);
  const calculation = calculateBattery(project, panels);

  function updateBattery(patch: Partial<typeof project.battery>) {
    updateProject({ battery: { ...project.battery, ...patch } });
  }

  function updateModel(patch: Partial<typeof project.battery.model>) {
    updateProject({
      battery: { ...project.battery, model: { ...project.battery.model, ...patch } },
    });
  }

  return (
    <StepPage
      title="Banco de baterías"
      description="Definí la autonomía, la profundidad de descarga y el modelo de batería. El sistema calcula el banco y revisa las corrientes."
      backHref="/calculadora/paneles"
      nextHref="/calculadora/equipos"
      blockedReason={
        project.battery.model.capacityAh <= 0
          ? 'Completá la capacidad y la tensión de la batería.'
          : undefined
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Tensión del sistema" htmlFor="system-voltage">
            <Select
              id="system-voltage"
              value={project.battery.voltage ?? calculation.suggestedVoltage}
              onChange={(event) => updateBattery({ voltage: Number(event.target.value) })}
            >
              <option value={12}>12 V</option>
              <option value={24}>24 V</option>
              <option value={48}>48 V</option>
            </Select>
            <button
              type="button"
              className="mt-1 text-xs font-semibold text-ink underline"
              onClick={() =>
                updateBattery({ voltage: suggestedVoltage(panels.nominalW) })
              }
            >
              Sugerido: {suggestedVoltage(panels.nominalW)} V
            </button>
          </Field>
          <Field label="Días de autonomía">
            <NumberInput
              value={project.battery.autonomyDays}
              min={0}
              max={30}
              onValueChange={(value) => updateBattery({ autonomyDays: value })}
            />
          </Field>
          <Field label="Día de reserva" hint="Se suma a la autonomía">
            <NumberInput
              value={project.battery.reserveDays}
              min={0}
              max={30}
              onValueChange={(value) => updateBattery({ reserveDays: value })}
            />
          </Field>
          <Field label="Profundidad de descarga (%)">
            <NumberInput
              value={project.battery.depthOfDischarge}
              min={10}
              max={100}
              onValueChange={(value) => updateBattery({ depthOfDischarge: value })}
            />
          </Field>
          <Field label="Eficiencia de descarga (%)">
            <NumberInput
              value={project.battery.dischargeEfficiency}
              min={10}
              max={100}
              onValueChange={(value) => updateBattery({ dischargeEfficiency: value })}
            />
          </Field>
          <Field label="Eficiencia del inversor (%)">
            <NumberInput
              value={project.battery.inverterEfficiency}
              min={10}
              max={100}
              onValueChange={(value) => updateBattery({ inverterEfficiency: value })}
            />
          </Field>
        </div>

        <div className="rounded-xl border border-line p-4">
          <div className="mb-3 flex items-center gap-2">
            <BatteryCharging className="size-5 text-solar" />
            <p className="font-semibold text-ink">Datos de la batería</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Modelo">
              <Input
                value={project.battery.model.model}
                onChange={(event) => updateModel({ model: event.target.value })}
                placeholder="Moura CLEAN 12MF220"
              />
            </Field>
            <Field label="Capacidad (Ah)">
              <NumberInput
                value={project.battery.model.capacityAh}
                min={1}
                onValueChange={(value) => updateModel({ capacityAh: value })}
              />
            </Field>
            <Field label="Tensión de batería (V)">
              <NumberInput
                value={project.battery.model.voltage}
                min={1}
                onValueChange={(value) => updateModel({ voltage: value })}
              />
            </Field>
            <Field label="Precio USD">
              <NumberInput
                value={project.battery.model.price}
                min={0}
                onValueChange={(value) => updateModel({ price: value })}
              />
            </Field>
          </div>
        </div>

        <div className="grid gap-3 rounded-xl bg-sand p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Capacidad del banco" value={`${formatNumber(calculation.bankAh, 0)} Ah`} />
          <Metric label="Cantidad de baterías" value={`${calculation.qty}`} />
          <Metric
            label="Disposición"
            value={`${calculation.series} serie × ${calculation.parallel} paralelo`}
          />
          <Metric label="Capacidad total" value={`${formatNumber(calculation.capacityAh, 0)} Ah`} />
        </div>

        <div className="grid gap-3 rounded-xl border border-line p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Corriente máxima de carga" value={`${formatNumber(calculation.maxChargeA, 1)} A`} />
          <Metric label="Corriente máxima de descarga" value={`${formatNumber(calculation.maxDischargeA, 1)} A`} />
          <Metric label="C5 (descarga)" value={`${formatNumber(calculation.c5A, 1)} A`} />
          <Metric label="C20 (carga)" value={`${formatNumber(calculation.c20A, 1)} A`} />
        </div>

        <p className="flex items-center gap-2 text-xs text-panel">
          <Zap className="size-4 text-solar" />
          El banco se calcula con consumo máximo diario × (autonomía + reserva) y las eficiencias
          indicadas.
        </p>
      </div>
    </StepPage>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-panel">{label}</p>
      <p className="num mt-1 font-semibold text-ink">{value}</p>
    </div>
  );
}
