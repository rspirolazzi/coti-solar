import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { TtlCache } from '@/lib/cache';
import { checkRateLimit, clientKey } from '@/lib/rate-limit';
import { fetchPvgisRadiation } from '@/lib/providers/pvgis';
import { fetchNasaRadiation } from '@/lib/providers/nasa';
import type { RadiationResponse } from '@/lib/providers/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const cache = new TtlCache<RadiationResponse>(250);
const MONTH = 30 * 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const rate = checkRateLimit(clientKey(request, 'radiation'), 20, 60_000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: { code: 'rate_limited', message: 'Demasiadas consultas de radiación.' } },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } },
    );
  }

  const url = new URL(request.url);
  const lat = Number(url.searchParams.get('lat'));
  const lng = Number(url.searchParams.get('lon') ?? url.searchParams.get('lng'));
  const tiltRaw = url.searchParams.get('tilt');
  const azimuthRaw = url.searchParams.get('azimuth');
  const tiltDeg = tiltRaw === null || tiltRaw === '' ? undefined : Number(tiltRaw);
  const azimuthDeg = azimuthRaw === null || azimuthRaw === '' ? undefined : Number(azimuthRaw);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json(
      { error: { code: 'invalid_coordinates', message: 'Coordenadas inválidas.' } },
      { status: 400 },
    );
  }
  if (tiltDeg !== undefined && (!Number.isFinite(tiltDeg) || tiltDeg < 0 || tiltDeg > 90)) {
    return NextResponse.json(
      { error: { code: 'invalid_tilt', message: 'La inclinación debe estar entre 0° y 90°.' } },
      { status: 400 },
    );
  }
  if (azimuthDeg !== undefined && (!Number.isFinite(azimuthDeg) || azimuthDeg < -180 || azimuthDeg > 180)) {
    return NextResponse.json(
      { error: { code: 'invalid_azimuth', message: 'La orientación debe estar entre -180° y 180°.' } },
      { status: 400 },
    );
  }

  const key = `${lat.toFixed(4)},${lng.toFixed(4)},${tiltDeg ?? 'opt'},${azimuthDeg ?? 'auto'}`;
  const cached = cache.get(key);
  if (cached) return NextResponse.json(cached);

  try {
    const result = await fetchPvgisRadiation({ lat, lng, tiltDeg, azimuthDeg });
    cache.set(key, result, MONTH);
    return NextResponse.json(result);
  } catch (pvgisError) {
    console.warn('PVGIS failed, using NASA POWER fallback', pvgisError);
    try {
      const fallback = await fetchNasaRadiation({ lat, lng, tiltDeg, azimuthDeg });
      cache.set(key, fallback, MONTH);
      return NextResponse.json(fallback);
    } catch (nasaError) {
      console.error('radiation providers failed', { pvgisError, nasaError });
      return NextResponse.json(
        {
          error: {
            code: 'radiation_unavailable',
            message: 'No pudimos obtener radiación para ese punto. Cargá HSP manual.',
          },
        },
        { status: 502 },
      );
    }
  }
}
