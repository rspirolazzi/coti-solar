'use client';

import { Plus, Trash2 } from 'lucide-react';
import { StepPage } from '@/components/wizard/step-page';
import { EnergyChart } from '@/components/charts/energy-chart';
import { Button } from '@/components/ui/button';
import { Field, Input, NumberInput, Select } from '@/components/ui/field';
import { calculatePanels } from '@/domain/calculations';
import { createEmptyPanel } from '@/domain/defaults';
import type { PanelItem } from '@/domain/types';
import { useProject, useProjectStore } from '@/lib/store';
import { formatNumber, formatPercent } from '@/lib/format';

export function PanelsStep() {
  const project = useProject();
  const updateProject = useProjectStore((state) => state.updateProject);
  const calculation = calculatePanels(project);
  const radiation = project.location?.radiation;

  function updateItem(id: string, patch: Partial<PanelItem>) {
    updateProject({
      panels: {
        ...project.panels,
        items: project.panels.items.map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        ),
      },
    });
  }

  function addPanel() {
    updateProject({ panels: { ...project.panels, items: [...project.panels.items, createEmptyPanel()] } });
  }

  function removePanel(id: string) {
    updateProject({
      panels: { ...project.panels, items: project.panels.items.filter((item) => item.id !== id) },
    });
  }

  const blockedReason = !radiation
    ? 'Primero elegí una ubicación o cargá HSP manual.'
    : project.panels.items.length === 0
      ? 'Agregá al menos un panel.'
      : undefined;

  return (
    <StepPage
      title="Paneles solares"
      description="Cargá el modelo eléctrico y el precio. CotiSolar calcula la cantidad necesaria para el peor mes y te deja ajustarla."
      backHref="/calculadora/consumo"
      nextHref="/calculadora/baterias"
      blockedReason={blockedReason}
    >
      <div className="space-y-5">
        {!radiation ? (
          <p className="rounded-xl border border-dashed border-line p-4 text-sm text-panel">
            Sin radiación no se puede sugerir la cantidad de paneles. Podés volver a ubicación o
            continuar con una cantidad manual.
          </p>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-panel">
                <th className="px-2 py-2">Modelo</th>
                <th className="px-2 py-2">W</th>
                <th className="px-2 py-2">Vmp</th>
                <th className="px-2 py-2">Voc</th>
                <th className="px-2 py-2">Isc</th>
                <th className="px-2 py-2">Imp</th>
                <th className="px-2 py-2">Precio</th>
                <th className="px-2 py-2">Cant.</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {project.panels.items.map((panel) => (
                <tr key={panel.id} className="border-b border-line/70">
                  <td className="px-2 py-2">
                    <Input
                      aria-label="Modelo de panel"
                      value={panel.model}
                      onChange={(event) => updateItem(panel.id, { model: event.target.value })}
                      placeholder="Solartec 80 W"
                    />
                  </td>
                  {(['powerW', 'vmp', 'voc', 'isc', 'imp'] as const).map((field) => (
                    <td key={field} className="px-2 py-2 w-24">
                      <NumberInput
                        aria-label={field}
                        value={panel[field]}
                        min={0}
                        onValueChange={(value) => updateItem(panel.id, { [field]: value })}
                      />
                    </td>
                  ))}
                  <td className="px-2 py-2 w-32">
                    <NumberInput
                      aria-label="Precio"
                      value={panel.price}
                      min={0}
                      onValueChange={(value) => updateItem(panel.id, { price: value })}
                    />
                  </td>
                  <td className="px-2 py-2 w-20">
                    <NumberInput
                      aria-label="Cantidad"
                      value={panel.qty}
                      min={1}
                      onValueChange={(value) => updateItem(panel.id, { qty: value })}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label="Eliminar panel"
                      onClick={() => removePanel(panel.id)}
                    >
                      <Trash2 className="size-4 text-danger" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <Button type="button" variant="secondary" onClick={addPanel}>
            <Plus className="size-4" />
            Agregar panel
          </Button>
          <Field label="Modo de cantidad" className="w-48">
            <Select
              value={project.panels.qtyMode}
              onChange={(event) =>
                updateProject({
                  panels: {
                    ...project.panels,
                    qtyMode: event.target.value as 'auto' | 'manual',
                    qtyOverride:
                      event.target.value === 'manual'
                        ? project.panels.qtyOverride ?? calculation.requiredQty
                        : undefined,
                  },
                })
              }
            >
              <option value="auto">Automática</option>
              <option value="manual">Manual</option>
            </Select>
          </Field>
          {project.panels.qtyMode === 'manual' ? (
            <Field label="Cantidad total" className="w-40">
              <NumberInput
                value={project.panels.qtyOverride ?? calculation.requiredQty}
                min={1}
                onValueChange={(value) =>
                  updateProject({ panels: { ...project.panels, qtyOverride: value } })
                }
              />
            </Field>
          ) : (
            <div className="rounded-xl bg-sand px-4 py-3 text-sm">
              <p className="text-panel">Cantidad sugerida</p>
              <p className="num text-lg font-bold text-ink">{calculation.requiredQty} paneles</p>
              <button
                type="button"
                className="text-xs font-semibold text-ink underline"
                onClick={() =>
                  updateProject({
                    panels: {
                      ...project.panels,
                      qtyMode: 'manual',
                      qtyOverride: calculation.requiredQty,
                    },
                  })
                }
              >
                Fijar cantidad manual
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-3 rounded-xl bg-sand p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Potencia FV" value={`${formatNumber(calculation.nominalW, 0)} W`} />
          <Metric label="Serie × paralelo" value={`${calculation.series} × ${calculation.parallel}`} />
          <Metric label="Generación anual" value={`${formatNumber(calculation.annualGenerationWh / 1000, 0)} kWh`} />
          <Metric label="Cobertura" value={formatPercent(calculation.annualCoverage)} />
        </div>

        {radiation ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink">Generación vs. consumo</p>
            <EnergyChart data={calculation.monthly} />
            <p className="text-xs text-panel">
              HSP de {radiation.provider.toUpperCase()} · {radiation.database} · inclinación{' '}
              {radiation.tiltDeg}°.
            </p>
          </div>
        ) : null}
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
