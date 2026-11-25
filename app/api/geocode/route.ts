import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { TtlCache } from '@/lib/cache';
import { checkRateLimit, clientKey } from '@/lib/rate-limit';
import { env } from '@/lib/env';
import { searchPhoton, reversePhoton } from '@/lib/providers/photon';
import { searchGoogle, reverseGoogle } from '@/lib/providers/google';
import type { GeocodeResponse, GeocodeResult } from '@/lib/providers/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const cache = new TtlCache<GeocodeResponse>(500);
const DAY = 24 * 60 * 60 * 1000;

function errorResponse(message: string, status: number, retryAfter = 0) {
  return NextResponse.json(
    { error: { code: status === 429 ? 'rate_limited' : 'geocode_error', message } },
    {
      status,
      headers: retryAfter ? { 'Retry-After': String(retryAfter) } : undefined,
    },
  );
}

export async function GET(request: NextRequest) {
  const rate = checkRateLimit(clientKey(request, 'geocode'), 30, 60_000);
  if (!rate.ok) return errorResponse('Demasiadas búsquedas. Probá en un minuto.', 429, rate.retryAfter);

  const url = new URL(request.url);
  const query = url.searchParams.get('q')?.trim() || '';
  const latRaw = url.searchParams.get('lat');
  const lngRaw = url.searchParams.get('lng');
  const lat = latRaw === null ? undefined : Number(latRaw);
  const lng = lngRaw === null ? undefined : Number(lngRaw);
  const reverse = !query && Number.isFinite(lat) && Number.isFinite(lng);

  if (!reverse && (query.length < 2 || query.length > 200)) {
    return errorResponse('Ingresá una dirección de al menos 2 caracteres.', 400);
  }
  if (reverse && (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat!) > 90 || Math.abs(lng!) > 180)) {
    return errorResponse('Coordenadas inválidas.', 400);
  }

  const cacheKey = reverse ? `reverse:${lat},${lng}` : `search:${query.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  const useGoogle = env.geocoderProvider === 'google' && !!env.googleMapsApiKey;
  let results: GeocodeResult[] = [];
  let source: GeocodeResponse['source'] = 'photon';

  try {
    if (useGoogle) {
      results = reverse
        ? await reverseGoogle(lat!, lng!, env.googleMapsApiKey)
        : await searchGoogle(query, env.googleMapsApiKey);
      source = 'google';
    } else {
      results = reverse ? await reversePhoton(lat!, lng!) : await searchPhoton(query);
      source = 'photon';
    }
  } catch (primaryError) {
    if (useGoogle) {
      try {
        results = reverse ? await reversePhoton(lat!, lng!) : await searchPhoton(query);
        source = 'photon';
      } catch {
        console.error('geocode failed', primaryError);
        return errorResponse('No pudimos buscar la dirección. Probá con coordenadas.', 502);
      }
    } else {
      console.error('geocode failed', primaryError);
      return errorResponse('No pudimos buscar la dirección. Probá con coordenadas.', 502);
    }
  }

  if (results.length === 0 && !reverse) {
    return NextResponse.json({ results: [], source });
  }

  const payload: GeocodeResponse = { results, source };
  cache.set(cacheKey, payload, DAY);
  return NextResponse.json(payload);
}
