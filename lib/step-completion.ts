import type { ProjectDraft } from '@/domain/types';

export function stepCompletion(project: ProjectDraft) {
  const hasRadiation =
    !!project.location?.radiation && project.location.radiation.monthlyHsp.length === 12;
  return {
    ubicacion: hasRadiation,
    consumo: project.consumption.items.length > 0,
    paneles: project.panels.items.length > 0 && project.panels.items.some((p) => p.powerW > 0),
    baterias: project.battery.model.capacityAh > 0 && project.battery.model.voltage > 0,
    equipos:
      project.equipment.controllers.length > 0 ||
      project.equipment.inverter.continuousW > 0,
    resumen: false,
  } satisfies Record<string, boolean>;
}
