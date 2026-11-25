import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPvgisRadiation } from '@/lib/providers/pvgis';
import { fetchNasaRadiation } from '@/lib/providers/nasa';

const pvgisPayload = {
  inputs: {
    meteo_data: { radiation_db: 'PVGIS-SARAH3', year_min: 2005, year_max: 2023 },
    mounting_system: { fixed: { slope: { value: 32 }, azimuth: { value: -179 } } },
  },
  outputs: {
    monthly: {
      fixed: Array.from({ length: 12 }, (_, index) => ({
        month: index + 1,
        'H(i)_d': 3 + index / 2,
      })),
    },
    totals: { fixed: { 'H(i)_d': 5.25 } },
  },
};

const nasaPayload = {
  properties: {
    parameter: {
      ALLSKY_SFC_SW_DWN: {
        JAN: 7.2,
        FEB: 6.3,
        MAR: 5.2,
        APR: 3.9,
        MAY: 2.7,
        JUN: 2.3,
        JUL: 2.4,
        AUG: 3.3,
        SEP: 4.4,
        OCT: 5.6,
        NOV: 6.8,
        DEC: 7.5,
      },
    },
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('proveedor PVGIS', () => {
  it('parsea HSP, fuente, período e inclinación óptima', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(pvgisPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchPvgisRadiation({ lat: -34.576653, lng: -58.453485 });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0][0])).toContain('optimalinclination=1');
    expect(result.provider).toBe('pvgis');
    expect(result.database).toBe('PVGIS-SARAH3');
    expect(result.period).toBe('2005–2023');
    expect(result.monthlyHsp).toHaveLength(12);
    expect(result.optimalTiltDeg).toBe(32);
    expect(result.annualAverage).toBe(5.25);
  });

  it('usa angle y aspect cuando se pide una inclinación', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(pvgisPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await fetchPvgisRadiation({ lat: -34.576653, lng: -58.453485, tiltDeg: 49, azimuthDeg: -180 });
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain('angle=49');
    expect(url).toContain('aspect=-180');
    expect(url).not.toContain('optimalinclination=1');
  });
});

describe('proveedor NASA POWER', () => {
  it('convierte MJ/m²/día a kWh/m²/día y marca la fuente horizontal', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(nasaPayload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const result = await fetchNasaRadiation({ lat: -34.57, lng: -58.45 });
    expect(result.provider).toBe('nasa');
    expect(result.monthlyHsp[0]).toBe(7.2);
    expect(result.database).toContain('horizontal');
  });
});
