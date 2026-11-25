import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**tiles.openfreemap.org/**', (route) => route.abort());
});

test('carga el ejemplo y navega al consumo', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('La cuenta')).toBeVisible();
  await page.getByRole('button', { name: /Ver ejemplo Buenos Aires/i }).click();
  await page.waitForURL('**/calculadora/ubicacion', { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: 'Ubicación y radiación' })).toBeVisible();
  await expect(page.getByText('PVGIS').first()).toBeVisible();
  await page.getByRole('link', { name: /Continuar/i }).click();
  await expect(page).toHaveURL(/\/calculadora\/consumo/);
  await expect(page.getByRole('heading', { name: 'Consumo y energía' })).toBeVisible();
  await expect(page.getByText('1.570 Wh/día').first()).toBeVisible();
});

test('acepta coordenadas manuales y muestra la radiación', async ({ page }) => {
  await page.goto('/calculadora/ubicacion');
  await page.getByLabel('Latitud').fill('-34.576653');
  await page.getByLabel('Longitud').fill('-58.453485');
  await page.getByRole('button', { name: /Usar estas coordenadas/i }).click();
  await expect(page.getByText('Radiación del sitio')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/PVGIS/).first()).toBeVisible();
});

test('el borrador persiste al recargar', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Ver ejemplo Buenos Aires/i }).click();
  await page.waitForURL('**/calculadora/ubicacion', { timeout: 30_000 });
  await page.reload();
  await expect(page.getByText('Ciudad Autónoma de Buenos Aires, Argentina').first()).toBeVisible();
});
