'use client';

import { Copy, Plus, Trash2 } from 'lucide-react';
import { StepPage } from '@/components/wizard/step-page';
import { Button } from '@/components/ui/button';
import { Field, Input, NumberInput } from '@/components/ui/field';
import { calculateConsumption } from '@/domain/calculations';
import { createEmptyConsumption } from '@/domain/defaults';
import type { ConsumptionItem, ProjectDraft } from '@/domain/types';
import { useProject, useProjectStore } from '@/lib/store';
import { formatNumber } from '@/lib/format';

export function ConsumptionStep() {
  const project = useProject();
  const updateProject = useProjectStore((state) => state.updateProject);
  const totals = calculateConsumption(project);

  function updateItem(id: string, patch: Partial<ConsumptionItem>) {
    updateProject({
      consumption: {
        ...project.consumption,
        items: project.consumption.items.map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        ),
      },
    });
  }

  function addItem() {
    updateProject({
      consumption: {
        ...project.consumption,
        items: [...project.consumption.items, createEmptyConsumption()],
      },
    });
  }

  function removeItem(id: string) {
    updateProject({
      consumption: {
        ...project.consumption,
        items: project.consumption.items.filter((item) => item.id !== id),
      },
    });
  }

  function duplicateItem(item: ConsumptionItem) {
    updateProject({
      consumption: {
        ...project.consumption,
        items: [...project.consumption.items, { ...item, id: crypto.randomUUID(), name: `${item.name} (copia)` }],
      },
    });
  }

  function updateSettings(patch: Partial<ProjectDraft['consumption']>) {
    updateProject({ consumption: { ...project.consumption, ...patch } });
  }

  return (
    <StepPage
      title="Consumo y energía"
      description="Cargá los artefactos, la cantidad, la potencia y las horas de uso en invierno y verano."
      backHref="/calculadora/ubicacion"
      nextHref="/calculadora/paneles"
      blockedReason={project.consumption.items.length === 0 ? 'Agregá al menos un consumo.' : undefined}
    >
      <div className="space-y-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-panel">
                <th className="px-2 py-2">Dispositivo</th>
                <th className="px-2 py-2">Cant.</th>
                <th className="px-2 py-2">[W]</th>
                <th className="px-2 py-2">hs inv.</th>
                <th className="px-2 py-2">hs ver.</th>
                <th className="px-2 py-2">Wh/día inv.</th>
                <th className="px-2 py-2">Wh/día ver.</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {project.consumption.items.map((item) => (
                <tr key={item.id} className="border-b border-line/70 align-middle">
                  <td className="px-2 py-2">
                    <Input
                      aria-label="Dispositivo"
                      value={item.name}
                      onChange={(event) => updateItem(item.id, { name: event.target.value })}
                      placeholder="TV, heladera…"
                    />
                  </td>
                  <td className="px-2 py-2 w-24">
                    <NumberInput
                      aria-label="Cantidad"
                      value={item.qty}
                      min={1}
                      onValueChange={(value) => updateItem(item.id, { qty: value })}
                    />
                  </td>
                  <td className="px-2 py-2 w-28">
                    <NumberInput
                      aria-label="Potencia en watts"
                      value={item.watts}
                      min={0}
                      onValueChange={(value) => updateItem(item.id, { watts: value })}
                    />
                  </td>
                  <td className="px-2 py-2 w-24">
                    <NumberInput
                      aria-label="Horas invierno"
                      value={item.winterHours}
                      min={0}
                      max={24}
                      onValueChange={(value) => updateItem(item.id, { winterHours: value })}
                    />
                  </td>
                  <td className="px-2 py-2 w-24">
                    <NumberInput
                      aria-label="Horas verano"
                      value={item.summerHours}
                      min={0}
                      max={24}
                      onValueChange={(value) => updateItem(item.id, { summerHours: value })}
                    />
                  </td>
                  <td className="px-2 py-2 num text-panel">
                    {formatNumber(item.qty * item.watts * item.winterHours, 0)}
                  </td>
                  <td className="px-2 py-2 num text-panel">
                    {formatNumber(item.qty * item.watts * item.summerHours, 0)}
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`Duplicar ${item.name || 'consumo'}`}
                        onClick={() => duplicateItem(item)}
                      >
                        <Copy className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`Eliminar ${item.name || 'consumo'}`}
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="size-4 text-danger" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {project.consumption.items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-panel">
            Todavía no cargaste consumos. Empezá con “Luz”, “TV” o “Heladera”.
          </p>
        ) : null}

        <Button type="button" variant="secondary" onClick={addItem}>
          <Plus className="size-4" />
          Agregar consumo
        </Button>

        <div className="grid gap-3 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Factor de potencia" hint="Ej.: 0,7">
            <NumberInput
              value={project.consumption.powerFactor}
              step="0.05"
              min={0.1}
              max={1}
              onValueChange={(value) => updateSettings({ powerFactor: value })}
            />
          </Field>
          <Field label="Factor de seguridad (%)" hint="Ej.: 110">
            <NumberInput
              value={project.consumption.securityFactor}
              min={100}
              max={200}
              onValueChange={(value) => updateSettings({ securityFactor: value })}
            />
          </Field>
          <Field label="Eficiencia del sistema (%)" hint="Ej.: 60">
            <NumberInput
              value={project.consumption.systemEfficiency}
              min={10}
              max={100}
              onValueChange={(value) => updateSettings({ systemEfficiency: value })}
            />
          </Field>
          <Field label="Días nublados / frecuencia" hint="Ej.: 3 / 15">
            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                aria-label="Días nublados"
                value={project.consumption.cloudyDays}
                min={0}
                max={30}
                onValueChange={(value) => updateSettings({ cloudyDays: value })}
              />
              <NumberInput
                aria-label="Frecuencia de nubosidad"
                value={project.consumption.cloudyFrequency}
                min={1}
                max={31}
                onValueChange={(value) => updateSettings({ cloudyFrequency: value })}
              />
            </div>
          </Field>
        </div>

        <div className="grid gap-3 rounded-xl bg-sand p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Potencia total" value={`${formatNumber(totals.powerW, 0)} W`} />
          <Metric label="Consumo invierno" value={`${formatNumber(totals.winterWhDay, 0)} Wh/día`} />
          <Metric label="Consumo verano" value={`${formatNumber(totals.summerWhDay, 0)} Wh/día`} />
          <Metric label="Energía a generar" value={`${formatNumber(totals.totalEnergyWhDay, 0)} Wh/día`} />
        </div>
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
