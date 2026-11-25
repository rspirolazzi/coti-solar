import ExcelJS from 'exceljs';
import { MONTH_LABELS, calculateProject } from '@/domain/calculations';
import type { ProjectDraft } from '@/domain/types';

const INK = 'FF0C2233';
const SAND = 'FFF6F1E7';
const LINE = 'FFE4DCCD';

function safeText(value: string): string {
  const text = value ?? '';
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function header(sheet: ExcelJS.Worksheet, values: string[]) {
  const row = sheet.addRow(values);
  row.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: INK } };
  row.alignment = { vertical: 'middle' };
  row.height = 22;
}

function widths(sheet: ExcelJS.Worksheet, values: number[]) {
  values.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
}

export async function buildXlsx(project: ProjectDraft): Promise<Buffer> {
  const calculation = calculateProject(project);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CotiSolar';
  workbook.created = new Date();
  workbook.subject = 'Dimensionamiento fotovoltaico';
  workbook.title = project.name;

  const resumen = workbook.addWorksheet('Resumen');
  resumen.views = [{ showGridLines: false }];
  widths(resumen, [30, 28, 22, 22]);
  resumen.mergeCells('A1:D1');
  resumen.getCell('A1').value = 'CotiSolar — Dimensionamiento fotovoltaico';
  resumen.getCell('A1').font = { bold: true, size: 16, color: { argb: INK } };
  resumen.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SAND } };
  resumen.getRow(1).height = 28;
  resumen.addRow([]);
  resumen.addRow(['Proyecto', safeText(project.name)]);
  resumen.addRow(['Ubicación', safeText(project.location?.label ?? '—')]);
  resumen.addRow([
    'Coordenadas',
    project.location ? `${project.location.lat.toFixed(5)}, ${project.location.lng.toFixed(5)}` : '—',
  ]);
  resumen.addRow([
    'Radiación',
    project.location?.radiation
      ? `${project.location.radiation.provider.toUpperCase()} · ${project.location.radiation.database ?? ''} · ${project.location.radiation.period ?? ''}`
      : '—',
  ]);
  resumen.addRow([]);
  header(resumen, ['Indicador', 'Valor', 'Unidad', '']);
  const kpis: [string, number | string, string][] = [
    ['Consumo máximo', calculation.consumption.maxWhDay, 'Wh/día'],
    ['Energía a generar', calculation.consumption.energyToGenerateWhDay, 'Wh/día'],
    ['Energía total diaria', calculation.consumption.totalEnergyWhDay, 'Wh/día'],
    ['Potencia FV', calculation.panels.nominalW, 'W'],
    ['Paneles', calculation.panels.totalQty, 'unidades'],
    ['Banco de baterías', calculation.battery.capacityAh, 'Ah'],
    ['Baterías', calculation.battery.qty, 'unidades'],
    ['Inversión total', calculation.costs.total, 'USD'],
  ];
  kpis.forEach(([label, value, unit]) => resumen.addRow([label, value, unit, '']));
  resumen.getColumn(2).numFmt = '#,##0.00';
  resumen.eachRow((row, index) => {
    row.alignment = { vertical: 'middle' };
    if (index > 1) row.border = { bottom: { style: 'hair', color: { argb: LINE } } };
  });

  const consume = workbook.addWorksheet('Consumos');
  widths(consume, [28, 10, 10, 12, 12, 14, 14]);
  header(consume, ['Dispositivo', 'Cantidad', 'W', 'hs invierno', 'hs verano', 'Wh/día invierno', 'Wh/día verano']);
  project.consumption.items.forEach((item) => {
    consume.addRow([
      safeText(item.name),
      item.qty,
      item.watts,
      item.winterHours,
      item.summerHours,
      item.qty * item.watts * item.winterHours,
      item.qty * item.watts * item.summerHours,
    ]);
  });
  consume.addRow([]);
  consume.addRow(['Total', '', calculation.consumption.powerW, '', '', calculation.consumption.winterWhDay, calculation.consumption.summerWhDay]);
  consume.lastRow!.font = { bold: true };
  consume.getColumn(6).numFmt = '#,##0.00';
  consume.getColumn(7).numFmt = '#,##0.00';

  const panels = workbook.addWorksheet('Paneles');
  widths(panels, [24, 10, 10, 10, 10, 10, 12, 10, 14]);
  header(panels, ['Modelo', 'W', 'Vmp', 'Voc', 'Isc', 'Imp', 'Precio', 'Cantidad', 'Subtotal']);
  project.panels.items.forEach((panel) => {
    panels.addRow([
      safeText(panel.model),
      panel.powerW,
      panel.vmp,
      panel.voc,
      panel.isc,
      panel.imp,
      panel.price,
      panel.qty,
      panel.price * panel.qty,
    ]);
  });
  panels.getColumn(7).numFmt = '"USD" #,##0.00';
  panels.getColumn(9).numFmt = '"USD" #,##0.00';

  const batteries = workbook.addWorksheet('Baterías');
  widths(batteries, [24, 14, 12, 12, 12, 12, 12, 14]);
  header(batteries, ['Modelo', 'Capacidad Ah', 'Voltaje', 'Cantidad', 'Serie', 'Paralelo', 'Capacidad total', 'Precio']);
  batteries.addRow([
    safeText(project.battery.model.model),
    project.battery.model.capacityAh,
    project.battery.model.voltage,
    calculation.battery.qty,
    calculation.battery.series,
    calculation.battery.parallel,
    calculation.battery.capacityAh,
    calculation.battery.totalPrice,
  ]);
  batteries.getColumn(8).numFmt = '"USD" #,##0.00';

  const equipment = workbook.addWorksheet('Equipos');
  widths(equipment, [24, 16, 14, 12, 14]);
  header(equipment, ['Equipo', 'Modelo', 'Corriente A', 'Cantidad', 'Precio']);
  project.equipment.controllers.forEach((controller) => {
    equipment.addRow([safeText('Regulador'), safeText(controller.model), controller.currentA, controller.qty, controller.price * controller.qty]);
  });
  equipment.addRow(['Inversor', safeText(project.equipment.inverter.model), project.equipment.inverter.maxCurrentA, 1, project.equipment.inverter.price]);
  equipment.getColumn(5).numFmt = '"USD" #,##0.00';

  const costs = workbook.addWorksheet('Costos');
  widths(costs, [28, 14, 14, 14]);
  header(costs, ['Componente', 'Cantidad', 'Precio unitario', 'Subtotal']);
  const costRows: [string, number, number][] = [
    [
      'Paneles solares',
      calculation.panels.totalQty,
      calculation.panels.totalQty ? calculation.costs.panels / calculation.panels.totalQty : 0,
    ],
    [
      'Baterías',
      calculation.battery.qty,
      calculation.battery.qty ? calculation.costs.battery / calculation.battery.qty : 0,
    ],
    [
      'Reguladores',
      project.equipment.controllers.reduce((total, c) => total + c.qty, 0),
      project.equipment.controllers.reduce((total, c) => total + c.qty, 0)
        ? calculation.costs.controllers /
          project.equipment.controllers.reduce((total, c) => total + c.qty, 0)
        : 0,
    ],
    ['Inversor', 1, calculation.costs.inverter],
  ];
  costRows.forEach(([label, qty, unit]) =>
    costs.addRow([
      label,
      qty,
      unit,
      label === 'Reguladores' ? calculation.costs.controllers : qty * unit,
    ]),
  );
  project.costs.extras.forEach((extra) => costs.addRow([safeText(extra.label), extra.qty, extra.unitPrice, extra.qty * extra.unitPrice]));
  costs.addRow([]);
  costs.addRow(['TOTAL', '', '', calculation.costs.total]);
  costs.lastRow!.font = { bold: true, color: { argb: INK } };
  costs.getColumn(3).numFmt = '"USD" #,##0.00';
  costs.getColumn(4).numFmt = '"USD" #,##0.00';

  const radiation = workbook.addWorksheet('Radiación');
  widths(radiation, [10, ...Array(12).fill(10)]);
  header(radiation, ['Año', ...MONTH_LABELS]);
  radiation.addRow(['HSP', ...(project.location?.radiation?.monthlyHsp ?? Array(12).fill(0))]);
  radiation.addRow([]);
  radiation.addRow(['Fuente', project.location?.radiation?.provider ?? '—']);
  radiation.addRow(['Base', project.location?.radiation?.database ?? '—']);
  radiation.addRow(['Período', project.location?.radiation?.period ?? '—']);
  radiation.addRow(['Inclinación', project.location?.radiation?.tiltDeg ?? '—']);
  radiation.addRow(['Orientación', project.location?.radiation?.azimuthDeg ?? '—']);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
