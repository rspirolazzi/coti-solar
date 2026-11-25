import { describe, expect, it } from 'vitest';
import { calculateProject } from '@/domain/calculations';
import { createExampleProject } from '@/domain/defaults';

describe('caso golden Buenos Aires', () => {
  const project = createExampleProject();
  const result = calculateProject(project);

  it('reproduce el consumo y la energía de la planilla', () => {
    expect(result.consumption.powerW).toBe(275);
    expect(result.consumption.winterWhDay).toBe(1570);
    expect(result.consumption.summerWhDay).toBe(1325);
    expect(result.consumption.maxWhDay).toBe(1570);
    expect(result.consumption.energyToGenerateWhDay).toBeCloseTo(2878.33, 2);
    expect(result.consumption.totalEnergyWhDay).toBe(3454);
  });

  it('dimensiona el banco de baterías con 4 unidades', () => {
    expect(result.battery.bankAh).toBeCloseTo(432.65, 2);
    expect(result.battery.qty).toBe(4);
    expect(result.battery.series).toBe(2);
    expect(result.battery.parallel).toBe(2);
    expect(result.battery.capacityAh).toBe(440);
    expect(result.battery.maxChargeA).toBeCloseTo(50.1, 1);
    expect(result.battery.maxDischargeA).toBeCloseTo(19.47, 1);
  });

  it('mantiene 16 paneles manuales y calcula la cantidad sugerida', () => {
    expect(result.panels.totalQty).toBe(16);
    expect(result.panels.requiredQty).toBe(10);
    expect(result.panels.nominalW).toBe(1280);
    expect(result.panels.series).toBe(2);
    expect(result.panels.parallel).toBe(8);
  });

  it('valida regulador e inversor', () => {
    expect(result.equipment.requiredControllerA).toBeCloseTo(50.1, 1);
    expect(result.equipment.controllerTotalA).toBe(60);
    expect(result.equipment.controllerOk).toBe(true);
    expect(result.equipment.requiredInverterVA).toBeCloseTo(491.07, 1);
    expect(result.equipment.inverterContinuousOk).toBe(true);
  });

  it('reproduce el presupuesto de equipos y el total', () => {
    expect(result.costs.panels).toBeCloseTo(5719.48, 2);
    expect(result.costs.battery).toBeCloseTo(2203.4, 2);
    expect(result.costs.controllers).toBeCloseTo(359.68, 2);
    expect(result.costs.inverter).toBeCloseTo(997.65, 2);
    expect(result.costs.equipmentSubtotal).toBeCloseTo(9280.21, 2);
    expect(result.costs.extras).toBe(3400);
    expect(result.costs.total).toBeCloseTo(12680.21, 2);
  });

  it('marca la advertencia de C20 del ejemplo', () => {
    expect(result.issues.some((issue) => issue.code === 'battery-c20')).toBe(true);
  });
});
