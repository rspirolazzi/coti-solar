import type {
  BatteryResult,
  CalculationIssue,
  CalculationResult,
  ConsumptionResult,
  CostsResult,
  EquipmentResult,
  MonthlyEnergy,
  PanelsResult,
  PanelItem,
  ProjectDraft,
} from './types';

export const MONTH_LABELS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

export const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const WINTER_MONTHS = new Set([4, 5, 6, 7, 8, 9]);
const CHARGE_MARGIN = 1.25;
const AC_VOLTAGE = 220;
const EPSILON = 1e-9;

const safe = (value: number | undefined | null) =>
  Number.isFinite(value) ? (value as number) : 0;

const round2 = (value: number) => Math.round(safe(value) * 100) / 100;

export function suggestedVoltage(nominalW: number): number {
  if (nominalW <= 0) return 12;
  if (nominalW <= 1000) return 12;
  if (nominalW <= 5000) return 24;
  return 48;
}

export function calculateConsumption(project: ProjectDraft): ConsumptionResult {
  const items = project.consumption.items;
  const powerW = items.reduce((total, item) => total + safe(item.qty) * safe(item.watts), 0);
  const peakW = items.reduce((total, item) => total + safe(item.qty) * safe(item.watts), 0);
  const winterWhDay = items.reduce(
    (total, item) => total + safe(item.qty) * safe(item.watts) * safe(item.winterHours),
    0,
  );
  const summerWhDay = items.reduce(
    (total, item) => total + safe(item.qty) * safe(item.watts) * safe(item.summerHours),
    0,
  );
  const maxWhDay = Math.max(winterWhDay, summerWhDay);
  const security = safe(project.consumption.securityFactor) / 100;
  const efficiency = safe(project.consumption.systemEfficiency) / 100;
  const energyToGenerateWhDay = efficiency > 0 ? (maxWhDay * security) / efficiency : 0;
  const extraWhDay =
    energyToGenerateWhDay *
    (safe(project.consumption.cloudyDays) / Math.max(safe(project.consumption.cloudyFrequency), 1));
  const totalEnergyWhDay = energyToGenerateWhDay + extraWhDay;

  return {
    powerW: round2(powerW),
    peakW: round2(peakW),
    winterWhDay: round2(winterWhDay),
    summerWhDay: round2(summerWhDay),
    maxWhDay: round2(maxWhDay),
    energyToGenerateWhDay: round2(energyToGenerateWhDay),
    extraWhDay: round2(extraWhDay),
    totalEnergyWhDay: round2(totalEnergyWhDay),
  };
}

function panelsMatch(items: PanelItem[]): boolean {
  if (items.length <= 1) return true;
  const first = items[0];
  return items.every(
    (item) =>
      Math.abs(item.powerW - first.powerW) < 0.01 &&
      Math.abs(item.vmp - first.vmp) < 0.01 &&
      Math.abs(item.voc - first.voc) < 0.01 &&
      Math.abs(item.isc - first.isc) < 0.01 &&
      Math.abs(item.imp - first.imp) < 0.01,
  );
}

export function calculatePanels(project: ProjectDraft): PanelsResult {
  const items = project.panels.items;
  const first = items[0];
  const panelPowerW = safe(first?.powerW);
  const systemDerate = Math.min(1, Math.max(0.1, safe(project.consumption.systemEfficiency) / 100));
  const hsp = project.location?.radiation?.monthlyHsp;
  const monthlyHsp = Array.isArray(hsp) && hsp.length === 12 ? hsp.map(safe) : Array(12).fill(0);
  const demandAdjusted =
    safe(calculateConsumption(project).maxWhDay) *
    (safe(project.consumption.securityFactor) / 100);

  const perPanelMonthly = monthlyHsp.map((value) => panelPowerW * value * systemDerate);
  const requiredQty = perPanelMonthly.reduce((max, dailyWh) => {
    if (dailyWh <= EPSILON || demandAdjusted <= 0) return max;
    return Math.max(max, Math.ceil(demandAdjusted / dailyWh));
  }, 0);
  const qty =
    project.panels.qtyMode === 'manual'
      ? Math.max(0, Math.floor(safe(project.panels.qtyOverride)))
      : requiredQty;
  const nominalW = qty * panelPowerW;
  const voltage = safe(project.battery.voltage) || suggestedVoltage(nominalW);
  const series = voltage > 0 && safe(first?.vmp) > 0 ? Math.ceil(voltage / safe(first?.vmp)) : 0;
  const parallel = series > 0 ? Math.ceil(qty / series) : 0;

  const monthly: MonthlyEnergy[] = MONTH_LABELS.map((label, index) => {
    const demandWhDay = WINTER_MONTHS.has(index + 1)
      ? safe(calculateConsumption(project).winterWhDay)
      : safe(calculateConsumption(project).summerWhDay);
    const generationWhDay = perPanelMonthly[index] * qty;
    return {
      month: index + 1,
      label,
      hsp: round2(monthlyHsp[index]),
      demandWhDay: round2(demandWhDay),
      generationWhDay: round2(generationWhDay),
      coverage: demandWhDay > 0 ? round2(generationWhDay / demandWhDay) : 0,
    };
  });

  const annualDemandWh = monthly.reduce(
    (total, month) => total + month.demandWhDay * DAYS_IN_MONTH[month.month - 1],
    0,
  );
  const annualGenerationWh = monthly.reduce(
    (total, month) => total + month.generationWhDay * DAYS_IN_MONTH[month.month - 1],
    0,
  );

  return {
    totalQty: qty,
    requiredQty,
    series,
    parallel,
    nominalW: round2(nominalW),
    panelPowerW: round2(panelPowerW),
    monthly,
    annualGenerationWh: round2(annualGenerationWh),
    annualDemandWh: round2(annualDemandWh),
    annualCoverage: annualDemandWh > 0 ? round2(annualGenerationWh / annualDemandWh) : 0,
  };
}

export function calculateBattery(project: ProjectDraft, panels: PanelsResult): BatteryResult {
  const consumption = calculateConsumption(project);
  const battery = project.battery.model;
  const nominalW = panels.nominalW;
  const suggested = suggestedVoltage(nominalW);
  const voltage = safe(project.battery.voltage) || suggested;
  const dod = safe(project.battery.depthOfDischarge) / 100;
  const discharge = safe(project.battery.dischargeEfficiency) / 100;
  const inverter = safe(project.battery.inverterEfficiency) / 100;
  const days = safe(project.battery.autonomyDays) + safe(project.battery.reserveDays);
  const denominator = voltage * dod * discharge * inverter;
  const bankAh =
    denominator > 0 ? (consumption.maxWhDay * days) / denominator : 0;
  const batteryCapacity = safe(battery.capacityAh);
  const batteryVoltage = safe(battery.voltage);
  const qty =
    batteryCapacity > 0 && batteryVoltage > 0
      ? Math.ceil((bankAh * voltage) / (batteryCapacity * batteryVoltage))
      : 0;
  const series = batteryVoltage > 0 ? Math.ceil(voltage / batteryVoltage) : 0;
  const parallel = series > 0 ? Math.ceil(qty / series) : 0;
  const capacityAh = batteryCapacity * parallel;
  const panelIsc = safe(project.panels.items[0]?.isc);
  const maxChargeA = CHARGE_MARGIN * panels.parallel * panelIsc;
  const powerFactor = Math.max(safe(project.consumption.powerFactor), 0.1);
  const maxDischargeA =
    voltage > 0 && inverter > 0
      ? consumption.powerW / powerFactor / (voltage * inverter)
      : 0;

  return {
    voltage,
    suggestedVoltage: suggested,
    bankAh: round2(bankAh),
    qty,
    series,
    parallel,
    capacityAh: round2(capacityAh),
    maxChargeA: round2(maxChargeA),
    maxDischargeA: round2(maxDischargeA),
    c5A: round2((batteryCapacity / 5) * parallel),
    c20A: round2((batteryCapacity / 20) * parallel),
    totalPrice: round2(qty * safe(battery.price)),
  };
}

export function calculateEquipment(project: ProjectDraft, panels: PanelsResult): EquipmentResult {
  const consumption = calculateConsumption(project);
  const panelIsc = safe(project.panels.items[0]?.isc);
  const requiredControllerA = CHARGE_MARGIN * panels.parallel * panelIsc;
  const controllerTotalA = project.equipment.controllers.reduce(
    (total, controller) => total + safe(controller.currentA) * safe(controller.qty),
    0,
  );
  const powerFactor = Math.max(safe(project.consumption.powerFactor), 0.1);
  const requiredInverterVA = (consumption.powerW * CHARGE_MARGIN) / powerFactor;
  const peakAcA = (consumption.peakW * CHARGE_MARGIN) / (AC_VOLTAGE * powerFactor);
  const inverter = project.equipment.inverter;

  return {
    requiredControllerA: round2(requiredControllerA),
    controllerTotalA: round2(controllerTotalA),
    controllerOk: controllerTotalA + EPSILON >= requiredControllerA,
    requiredInverterVA: round2(requiredInverterVA),
    peakAcA: round2(peakAcA),
    inverterContinuousOk: safe(inverter.continuousW) + EPSILON >= requiredInverterVA,
    inverterPeakOk: safe(inverter.maxCurrentA) + EPSILON >= peakAcA,
  };
}

export function calculateCosts(
  project: ProjectDraft,
  panels: PanelsResult,
  battery: BatteryResult,
): CostsResult {
  const panelsCost =
    project.panels.items.length > 0
      ? panels.totalQty *
        (project.panels.items.reduce(
          (total, panel) => total + safe(panel.price) * safe(panel.qty),
          0,
        ) /
          Math.max(
            project.panels.items.reduce((total, panel) => total + safe(panel.qty), 0),
            1,
          ))
      : 0;
  const controllersCost = project.equipment.controllers.reduce(
    (total, controller) => total + safe(controller.price) * safe(controller.qty),
    0,
  );
  const inverterCost = safe(project.equipment.inverter.price);
  const extraTotal = project.costs.extras.reduce(
    (total, extra) => total + safe(extra.qty) * safe(extra.unitPrice),
    0,
  );
  const panelsRounded = round2(panelsCost);
  const batteryRounded = round2(battery.totalPrice);
  const controllersRounded = round2(controllersCost);
  const inverterRounded = round2(inverterCost);
  const equipmentSubtotal = round2(
    panelsRounded + batteryRounded + controllersRounded + inverterRounded,
  );
  const extras = round2(extraTotal);
  const margin = round2(((equipmentSubtotal + extras) * safe(project.costs.marginPct)) / 100);

  return {
    panels: panelsRounded,
    battery: batteryRounded,
    controllers: controllersRounded,
    inverter: inverterRounded,
    equipmentSubtotal,
    extras,
    margin,
    total: round2(equipmentSubtotal + extras + margin),
    currency: project.costs.currency,
  };
}

export function calculateProject(project: ProjectDraft): CalculationResult {
  const consumption = calculateConsumption(project);
  const panels = calculatePanels(project);
  const battery = calculateBattery(project, panels);
  const equipment = calculateEquipment(project, panels);
  const costs = calculateCosts(project, panels, battery);
  const issues: CalculationIssue[] = [];

  if (!project.location?.radiation) {
    issues.push({
      code: 'radiation-missing',
      message: 'Falta la radiación del sitio. Elegí una ubicación o cargá HSP manual.',
      severity: 'error',
      field: 'location',
    });
  }
  if (project.consumption.items.length === 0) {
    issues.push({
      code: 'consumption-empty',
      message: 'Cargá al menos un consumo para dimensionar.',
      severity: 'error',
      field: 'consumption',
    });
  }
  if (project.panels.items.length === 0 || panels.panelPowerW <= 0) {
    issues.push({
      code: 'panels-empty',
      message: 'Cargá al menos un panel con potencia.',
      severity: 'error',
      field: 'panels',
    });
  } else if (!panelsMatch(project.panels.items)) {
    issues.push({
      code: 'panels-mixed',
      message: 'Todos los paneles del arreglo deben compartir el mismo modelo eléctrico.',
      severity: 'error',
      field: 'panels',
    });
  }
  if (project.panels.qtyMode === 'manual' && panels.totalQty < panels.requiredQty) {
    issues.push({
      code: 'panels-under',
      message: `La cantidad manual (${panels.totalQty}) es menor a la requerida (${panels.requiredQty}).`,
      severity: 'warning',
      field: 'panels',
    });
  }
  if (panels.series > 0 && panels.totalQty % panels.series !== 0) {
    issues.push({
      code: 'panels-not-divisible',
      message: 'La cantidad de paneles no es múltiplo exacto de las series; se redondea el paralelo.',
      severity: 'warning',
      field: 'panels',
    });
  }
  if (!equipment.controllerOk) {
    issues.push({
      code: 'controller-under',
      message: `El regulador suma ${equipment.controllerTotalA} A y se requieren ${equipment.requiredControllerA} A.`,
      severity: 'warning',
      field: 'equipment',
    });
  }
  if (!equipment.inverterContinuousOk) {
    issues.push({
      code: 'inverter-under',
      message: `El inversor es de ${project.equipment.inverter.continuousW} W y se requieren ${equipment.requiredInverterVA} VA.`,
      severity: 'warning',
      field: 'equipment',
    });
  }
  if (battery.qty === 0 && project.consumption.items.length > 0) {
    issues.push({
      code: 'battery-empty',
      message: 'Revisá la capacidad, tensión y precio de la batería.',
      severity: 'error',
      field: 'battery',
    });
  }
  if (battery.maxChargeA > battery.c20A && battery.c20A > 0) {
    issues.push({
      code: 'battery-c20',
      message: 'La corriente máxima de carga supera C20; revisá el banco.',
      severity: 'warning',
      field: 'battery',
    });
  }
  if (battery.maxDischargeA > battery.c5A && battery.c5A > 0) {
    issues.push({
      code: 'battery-c5',
      message: 'La corriente máxima de descarga supera C5; revisá el banco.',
      severity: 'warning',
      field: 'battery',
    });
  }

  return {
    consumption,
    panels,
    battery,
    equipment,
    costs,
    issues,
    ready: issues.every((issue) => issue.severity !== 'error'),
  };
}

export function getPanelQuantity(project: ProjectDraft): number {
  return project.panels.qtyMode === 'manual'
    ? Math.max(0, Math.floor(safe(project.panels.qtyOverride)))
    : calculatePanels(project).requiredQty;
}
