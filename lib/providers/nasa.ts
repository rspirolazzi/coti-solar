import type { RadiationRequest, RadiationResponse } from './types';

const NASA_BASE = 'https://power.larc.nasa.gov/api/temporal/climatology/point';
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

interface NasaResponse {
  properties?: {
    parameter?: Record<string, Record<string, number>>;
  };
}

export async function fetchNasaRadiation({
  lat,
  lng,
  tiltDeg,
  azimuthDeg,
}: RadiationRequest): Promise<RadiationResponse> {
  const url = new URL(NASA_BASE);
  url.searchParams.set('parameters', 'ALLSKY_SFC_SW_DWN');
  url.searchParams.set('community', 'RE');
  url.searchParams.set('longitude', String(lng));
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('format', 'JSON');

  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`NASA POWER ${response.status}`);
  const json = (await response.json()) as NasaResponse;
  const parameter = json.properties?.parameter?.ALLSKY_SFC_SW_DWN;
  if (!parameter) throw new Error('NASA POWER no devolvió radiación');

  const monthlyHsp = MONTHS.map((month) => {
    const value = Number(parameter[month]);
    if (!Number.isFinite(value) || value <= -900) return 0;
    // NASA POWER entrega kWh/m²/día para ALLSKY_SFC_SW_DWN.
    return Math.round(value * 100) / 100;
  });
  const valid = monthlyHsp.filter((value) => value > 0);
  const annualAverage = valid.length
    ? valid.reduce((total, value) => total + value, 0) / valid.length
    : 0;

  return {
    provider: 'nasa',
    database: 'NASA POWER (horizontal)',
    period: 'climatología',
    tiltDeg: tiltDeg ?? 0,
    azimuthDeg: azimuthDeg ?? (lat >= 0 ? 0 : -180),
    monthlyHsp,
    annualAverage: Math.round(annualAverage * 100) / 100,
    fetchedAt: new Date().toISOString(),
  };
}
