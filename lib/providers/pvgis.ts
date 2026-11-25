import type { RadiationRequest, RadiationResponse } from './types';

const PVGIS_BASE = 'https://re.jrc.ec.europa.eu/api/v5_3/PVcalc';

interface PvgisMonthly {
  month: number;
  'H(i)_d': number;
}

interface PvgisResponse {
  inputs: {
    meteo_data: { radiation_db?: string; year_min?: number; year_max?: number };
    mounting_system: { fixed: { slope: { value: number }; azimuth: { value: number } } };
  };
  outputs: {
    monthly: { fixed: PvgisMonthly[] };
    totals: { fixed: { 'H(i)_d': number } };
  };
}

function equatorAzimuth(lat: number): number {
  return lat >= 0 ? 0 : -180;
}

export async function fetchPvgisRadiation({
  lat,
  lng,
  tiltDeg,
  azimuthDeg,
}: RadiationRequest): Promise<RadiationResponse> {
  const url = new URL(PVGIS_BASE);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('peakpower', '1');
  url.searchParams.set('loss', '14');
  url.searchParams.set('usehorizon', '1');
  url.searchParams.set('outputformat', 'json');
  const azimuth = azimuthDeg ?? equatorAzimuth(lat);
  if (typeof tiltDeg === 'number') {
    url.searchParams.set('angle', String(tiltDeg));
    url.searchParams.set('aspect', String(azimuth));
  } else {
    url.searchParams.set('optimalinclination', '1');
    url.searchParams.set('aspect', String(azimuth));
  }

  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(`PVGIS ${response.status}: ${message.slice(0, 180)}`);
  }
  const json = (await response.json()) as PvgisResponse;
  const monthly = json.outputs?.monthly?.fixed;
  if (!Array.isArray(monthly) || monthly.length !== 12) {
    throw new Error('PVGIS devolvió una tabla mensual incompleta');
  }

  const monthlyHsp = monthly
    .sort((a, b) => a.month - b.month)
    .map((month) => Number(month['H(i)_d']) || 0);
  const meteo = json.inputs?.meteo_data ?? {};
  const mounting = json.inputs?.mounting_system?.fixed;
  const actualTilt = mounting?.slope?.value;
  const actualAzimuth = mounting?.azimuth?.value;
  const yearMin = meteo.year_min;
  const yearMax = meteo.year_max;

  return {
    provider: 'pvgis',
    database: meteo.radiation_db || 'PVGIS',
    period: yearMin && yearMax ? `${yearMin}–${yearMax}` : 'climatología',
    tiltDeg: typeof actualTilt === 'number' ? actualTilt : (tiltDeg ?? 0),
    azimuthDeg: typeof actualAzimuth === 'number' ? actualAzimuth : azimuth,
    monthlyHsp,
    optimalTiltDeg: typeof tiltDeg === 'number' ? undefined : actualTilt,
    annualAverage: Number(json.outputs?.totals?.fixed?.['H(i)_d']) || 0,
    fetchedAt: new Date().toISOString(),
  };
}
