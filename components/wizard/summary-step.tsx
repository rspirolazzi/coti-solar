'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, Loader2, Plus, Printer, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { StepPage } from '@/components/wizard/step-page';
import { SystemDiagram } from '@/components/wizard/system-diagram';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Input, NumberInput, Select } from '@/components/ui/field';
import { calculateProject } from '@/domain/calculations';
import { createEmptyCost } from '@/domain/defaults';
import type { CostCategory, CostItem } from '@/domain/types';
import { useProject, useProjectStore } from '@/lib/store';
import { downloadBlob, formatCurrency, formatNumber, slugify } from '@/lib/format';

const categoryLabels: Record<CostCategory, string> = {
  cables: 'Cables',
  tablero: 'Tablero',
  soportes: 'Soportes',
  instalacion: 'Instalación',
  transporte: 'Transporte',
  otros: 'Otros',
};

export function SummaryStep() {
  const project = useProject();
  const updateProject = useProjectStore((state) => state.updateProject);
  const calculation = calculateProject(project);
  const [busy, setBusy] = useState<'pdf' | 'xlsx' | null>(null);

  function updateExtra(id: string, patch: Partial<CostItem>) {
    updateProject({
      costs: {
        ...project.costs,
        extras: project.costs.extras.map((extra) => (extra.id === id ? { ...extra, ...patch } : extra)),
      },
    });
  }

  function addExtra() {
    updateProject({ costs: { ...project.costs, extras: [...project.costs.extras, createEmptyCost()] } });
  }

  function removeExtra(id: string) {
    updateProject({
      costs: { ...project.costs, extras: project.costs.extras.filter((extra) => extra.id !== id) },
    });
  }

  async function download(kind: 'pdf' | 'xlsx') {
    if (!calculation.ready) {
      toast.error('Revisá los errores antes de exportar.');
      return;
    }
    setBusy(kind);
    try {
      const response = await fetch(`/api/reports/${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(payload?.error?.message || 'No pudimos generar el reporte.');
      }
      const blob = await response.blob();
      const date = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `cotisolar-${slugify(project.name) || 'calculo'}-${date}.${kind}`);
      toast.success(kind === 'pdf' ? 'PDF descargado.' : 'Excel descargado.');
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Error al generar el reporte.');
    } finally {
      setBusy(null);
    }
  }

  const errors = calculation.issues.filter((issue) => issue.severity === 'error');
  const warnings = calculation.issues.filter((issue) => issue.severity === 'warning');

  return (
    <StepPage
      title="Resumen y presupuesto"
      description="Revisá el sistema, los costos y las advertencias. Después descargá el PDF o el Excel."
      backHref="/calculadora/equipos"
    >
      <div className="space-y-5">
        <Field label="Nombre del cálculo">
          <Input
            value={project.name}
            onChange={(event) => updateProject({ name: event.target.value })}
            placeholder="Casa de familia"
          />
        </Field>

        <SystemDiagram />

        <div className="grid gap-3 rounded-xl bg-sand p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Consumo máximo" value={`${formatNumber(calculation.consumption.maxWhDay, 0)} Wh/día`} />
          <Metric label="Potencia FV" value={`${formatNumber(calculation.panels.nominalW, 0)} W`} />
          <Metric label="Banco" value={`${formatNumber(calculation.battery.capacityAh, 0)} Ah`} />
          <Metric label="Inversión total" value={formatCurrency(calculation.costs.total)} />
        </div>

        {project.location ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line p-4 text-sm">
            <Badge variant="solar">Ubicación</Badge>
            <span className="font-semibold text-ink">{project.location.label}</span>
            <span className="text-panel">
              {project.location.lat.toFixed(4)}, {project.location.lng.toFixed(4)}
            </span>
            {project.location.radiation ? (
              <>
                <Badge>{project.location.radiation.provider.toUpperCase()}</Badge>
                <span className="text-panel">
                  {project.location.radiation.database} · {project.location.radiation.period} ·
                  inclinación {project.location.radiation.tiltDeg}°
                </span>
              </>
            ) : null}
          </div>
        ) : null}

        {errors.map((issue) => (
          <Alert key={issue.code} variant="error" title="Falta completar">
            {issue.message}
          </Alert>
        ))}
        {warnings.map((issue) => (
          <Alert key={issue.code} variant="warning" title="Revisar">
            {issue.message}
          </Alert>
        ))}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">Costos de instalación</h2>
            <Button type="button" variant="secondary" size="sm" onClick={addExtra}>
              <Plus className="size-4" />
              Agregar
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-panel">
                  <th className="px-2 py-2">Categoría</th>
                  <th className="px-2 py-2">Detalle</th>
                  <th className="px-2 py-2">Cant.</th>
                  <th className="px-2 py-2">Unitario USD</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {project.costs.extras.map((extra) => (
                  <tr key={extra.id} className="border-b border-line/70">
                    <td className="px-2 py-2">
                      <Select
                        aria-label="Categoría"
                        value={extra.category}
                        onChange={(event) =>
                          updateExtra(extra.id, { category: event.target.value as CostCategory })
                        }
                      >
                        {Object.entries(categoryLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        aria-label="Detalle"
                        value={extra.label}
                        onChange={(event) => updateExtra(extra.id, { label: event.target.value })}
                      />
                    </td>
                    <td className="w-24 px-2 py-2">
                      <NumberInput
                        aria-label="Cantidad"
                        value={extra.qty}
                        min={0}
                        onValueChange={(value) => updateExtra(extra.id, { qty: value })}
                      />
                    </td>
                    <td className="w-32 px-2 py-2">
                      <NumberInput
                        aria-label="Precio unitario"
                        value={extra.unitPrice}
                        min={0}
                        onValueChange={(value) => updateExtra(extra.id, { unitPrice: value })}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label="Eliminar costo"
                        onClick={() => removeExtra(extra.id)}
                      >
                        <Trash2 className="size-4 text-danger" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Margen (%)">
              <NumberInput
                value={project.costs.marginPct}
                min={0}
                max={100}
                onValueChange={(value) =>
                  updateProject({ costs: { ...project.costs, marginPct: value } })
                }
              />
            </Field>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-sm">
            <tbody>
              <CostRow label="Paneles solares" value={calculation.costs.panels} />
              <CostRow label="Banco de baterías" value={calculation.costs.battery} />
              <CostRow label="Reguladores de carga" value={calculation.costs.controllers} />
              <CostRow label="Inversor" value={calculation.costs.inverter} />
              <CostRow label="Extras de instalación" value={calculation.costs.extras} />
              <CostRow label="Margen" value={calculation.costs.margin} />
              <tr className="bg-ink text-white">
                <td className="px-4 py-3 font-semibold">Total</td>
                <td className="num px-4 py-3 text-right text-lg font-bold text-solar">
                  {formatCurrency(calculation.costs.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-3 pb-8">
          <Button onClick={() => void download('pdf')} disabled={!!busy || !calculation.ready}>
            {busy === 'pdf' ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Descargar PDF
          </Button>
          <Button
            variant="secondary"
            onClick={() => void download('xlsx')}
            disabled={!!busy || !calculation.ready}
          >
            {busy === 'xlsx' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="size-4" />
            )}
            Descargar Excel
          </Button>
          <Button variant="ghost" onClick={() => window.print()}>
            <Printer className="size-4" />
            Imprimir
          </Button>
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

function CostRow({ label, value }: { label: string; value: number }) {
  return (
    <tr className="border-b border-line/70">
      <td className="px-4 py-2 text-panel">{label}</td>
      <td className="num px-4 py-2 text-right font-medium text-ink">{formatCurrency(value)}</td>
    </tr>
  );
}
