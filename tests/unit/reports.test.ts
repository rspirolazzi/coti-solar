// @vitest-environment node
import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { PDFParse } from 'pdf-parse';
import { createExampleProject } from '@/domain/defaults';
import { buildPdf } from '@/lib/reports/pdf';
import { buildXlsx } from '@/lib/reports/xlsx';

describe('reportes', () => {
  const project = createExampleProject();

  it('genera un PDF válido con tres páginas', async () => {
    const buffer = await buildPdf(project);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    expect(parsed.total).toBe(3);
    expect(parsed.text).toContain('Ejemplo Buenos Aires');
    expect(parsed.text).toContain('12.680,21');
    await parser.destroy();
  }, 30_000);

  it('genera un Excel con las hojas y totales del ejemplo', async () => {
    const buffer = await buildXlsx(project);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      'Resumen',
      'Consumos',
      'Paneles',
      'Baterías',
      'Equipos',
      'Costos',
      'Radiación',
    ]);
    const costs = workbook.getWorksheet('Costos');
    const values = costs?.getSheetValues().flat().filter(Boolean);
    expect(values).toContain(12680.21);
  });
});
