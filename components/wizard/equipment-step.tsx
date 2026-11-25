'use client';

import { Plus, Trash2, Wrench } from 'lucide-react';
import { StepPage } from '@/components/wizard/step-page';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, Input, NumberInput } from '@/components/ui/field';
import { calculateEquipment, calculatePanels } from '@/domain/calculations';
import type { ControllerItem } from '@/domain/types';
import { useProject, useProjectStore } from '@/lib/store';
import { formatNumber } from '@/lib/format';

export function EquipmentStep() {
  const project = useProject();
  const updateProject = useProjectStore((state) => state.updateProject);
  const panels = calculatePanels(project);
  const calculation = calculateEquipment(project, panels);

  function addController() {
    const controller: ControllerItem = {
      id: crypto.randomUUID(),
      model: '',
      currentA: 0,
      price: 0,
      qty: 1,
    };
    updateProject({
      equipment: { ...project.equipment, controllers: [...project.equipment.controllers, controller] },
    });
  }

  function updateController(id: string, patch: Partial<ControllerItem>) {
    updateProject({
      equipment: {
        ...project.equipment,
        controllers: project.equipment.controllers.map((controller) =>
          controller.id === id ? { ...controller, ...patch } : controller,
        ),
      },
    });
  }

  function removeController(id: string) {
    updateProject({
      equipment: {
        ...project.equipment,
        controllers: project.equipment.controllers.filter((controller) => controller.id !== id),
      },
    });
  }

  function updateInverter(patch: Partial<typeof project.equipment.inverter>) {
    updateProject({
      equipment: {
        ...project.equipment,
        inverter: { ...project.equipment.inverter, ...patch },
      },
    });
  }

  const blockedReason =
    project.equipment.controllers.length === 0
      ? 'Agregá al menos un regulador de carga.'
      : project.equipment.inverter.continuousW <= 0
        ? 'Completá la potencia del inversor.'
        : undefined;

  return (
    <StepPage
      title="Regulador e inversor"
      description="Revisá la corriente del regulador y la potencia del inversor, y cargá los equipos que vas a presupuestar."
      backHref="/calculadora/baterias"
      nextHref="/calculadora/resumen"
      blockedReason={blockedReason}
    >
      <div className="space-y-5">
        <div className="grid gap-3 rounded-xl bg-sand p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-panel">Corriente requerida de regulador</p>
            <p className="num text-xl font-bold text-ink">{formatNumber(calculation.requiredControllerA, 1)} A</p>
          </div>
          <div>
            <p className="text-xs text-panel">Corriente total de reguladores</p>
            <p className={`num text-xl font-bold ${calculation.controllerOk ? 'text-close' : 'text-danger'}`}>
              {formatNumber(calculation.controllerTotalA, 1)} A
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-line p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Wrench className="size-5 text-solar" />
              <p className="font-semibold text-ink">Reguladores de carga</p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={addController}>
              <Plus className="size-4" />
              Agregar
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-panel">
                  <th className="px-2 py-2">Modelo</th>
                  <th className="px-2 py-2">Corriente (A)</th>
                  <th className="px-2 py-2">Precio USD</th>
                  <th className="px-2 py-2">Cant.</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {project.equipment.controllers.map((controller) => (
                  <tr key={controller.id} className="border-b border-line/70">
                    <td className="px-2 py-2">
                      <Input
                        aria-label="Modelo de regulador"
                        value={controller.model}
                        onChange={(event) => updateController(controller.id, { model: event.target.value })}
                        placeholder="SC40"
                      />
                    </td>
                    <td className="w-28 px-2 py-2">
                      <NumberInput
                        aria-label="Corriente del regulador"
                        value={controller.currentA}
                        min={0}
                        onValueChange={(value) => updateController(controller.id, { currentA: value })}
                      />
                    </td>
                    <td className="w-32 px-2 py-2">
                      <NumberInput
                        aria-label="Precio del regulador"
                        value={controller.price}
                        min={0}
                        onValueChange={(value) => updateController(controller.id, { price: value })}
                      />
                    </td>
                    <td className="w-20 px-2 py-2">
                      <NumberInput
                        aria-label="Cantidad de reguladores"
                        value={controller.qty}
                        min={1}
                        onValueChange={(value) => updateController(controller.id, { qty: value })}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label="Eliminar regulador"
                        onClick={() => removeController(controller.id)}
                      >
                        <Trash2 className="size-4 text-danger" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-line p-4">
          <p className="mb-3 font-semibold text-ink">Inversor de corriente</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Potencia requerida en CA" hint="Calculada">
              <Input readOnly value={`${formatNumber(calculation.requiredInverterVA, 0)} VA`} />
            </Field>
            <Field label="Corriente pico de salida CA" hint="Calculada">
              <Input readOnly value={`${formatNumber(calculation.peakAcA, 1)} A`} />
            </Field>
            <Field label="Modelo">
              <Input
                value={project.equipment.inverter.model}
                onChange={(event) => updateInverter({ model: event.target.value })}
                placeholder="TGP 24 600"
              />
            </Field>
            <Field label="Potencia continua (W)">
              <NumberInput
                value={project.equipment.inverter.continuousW}
                min={0}
                onValueChange={(value) => updateInverter({ continuousW: value })}
              />
            </Field>
            <Field label="Potencia pico (W)">
              <NumberInput
                value={project.equipment.inverter.surgeW}
                min={0}
                onValueChange={(value) => updateInverter({ surgeW: value })}
              />
            </Field>
            <Field label="Tensión de entrada (V)">
              <NumberInput
                value={project.equipment.inverter.inputV}
                min={0}
                onValueChange={(value) => updateInverter({ inputV: value })}
              />
            </Field>
            <Field label="Corriente máxima (A)">
              <NumberInput
                value={project.equipment.inverter.maxCurrentA}
                min={0}
                onValueChange={(value) => updateInverter({ maxCurrentA: value })}
              />
            </Field>
            <Field label="Precio USD">
              <NumberInput
                value={project.equipment.inverter.price}
                min={0}
                onValueChange={(value) => updateInverter({ price: value })}
              />
            </Field>
          </div>
        </div>

        {!calculation.controllerOk ? (
          <Alert variant="warning" title="Regulador justo">
            La suma de reguladores no alcanza la corriente requerida. Podés agregar otro equipo.
          </Alert>
        ) : null}
        {!calculation.inverterContinuousOk ? (
          <Alert variant="warning" title="Inversor justo">
            La potencia continua del inversor es menor que la requerida.
          </Alert>
        ) : null}
      </div>
    </StepPage>
  );
}
