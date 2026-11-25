import type { GeocodeResult } from './types';

interface GoogleResult {
  formatted_address: string;
  geometry: { location: { lat: number; lng: number } };
  address_components?: { long_name: string; types: string[] }[];
}

function component(result: GoogleResult, type: string): string | undefined {
  return result.address_components?.find((item) => item.types.includes(type))?.long_name;
}

export async function searchGoogle(query: string, apiKey: string): Promise<GeocodeResult[]> {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', query);
  url.searchParams.set('language', 'es');
  url.searchParams.set('region', 'ar');
  url.searchParams.set('key', apiKey);
  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(8_000),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Google respondió ${response.status}`);
  const json = (await response.json()) as { status: string; results?: GoogleResult[] };
  if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
    throw new Error(`Google Geocoding: ${json.status}`);
  }
  return (json.results ?? []).slice(0, 6).map((result) => ({
    label: result.formatted_address,
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    country: component(result, 'country'),
    admin1: component(result, 'administrative_area_level_1'),
  }));
}

export async function reverseGoogle(lat: number, lng: number, apiKey: string): Promise<GeocodeResult[]> {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('latlng', `${lat},${lng}`);
  url.searchParams.set('language', 'es');
  url.searchParams.set('key', apiKey);
  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(8_000),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Google respondió ${response.status}`);
  const json = (await response.json()) as { status: string; results?: GoogleResult[] };
  if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
    throw new Error(`Google Geocoding: ${json.status}`);
  }
  return (json.results ?? []).slice(0, 1).map((result) => ({
    label: result.formatted_address,
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    country: component(result, 'country'),
    admin1: component(result, 'administrative_area_level_1'),
  }));
}
