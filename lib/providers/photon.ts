import type { GeocodeResult } from './types';

interface PhotonProperties {
  name?: string;
  street?: string;
  housenumber?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  postcode?: string;
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: PhotonProperties;
}

function labelFor(properties: PhotonProperties): string {
  const street = [properties.street, properties.housenumber].filter(Boolean).join(' ');
  const parts = [
    properties.name,
    street,
    properties.city || properties.district,
    properties.state,
    properties.country,
  ].filter(Boolean);
  return [...new Set(parts)].join(', ');
}

function mapFeature(feature: PhotonFeature): GeocodeResult {
  return {
    label: labelFor(feature.properties) || 'Ubicación sin nombre',
    lat: feature.geometry.coordinates[1],
    lng: feature.geometry.coordinates[0],
    country: feature.properties.country,
    admin1: feature.properties.state,
  };
}

async function photonFetch(url: string): Promise<PhotonFeature[]> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(8_000),
    headers: {
      'User-Agent': 'CotiSolar/0.2 (+https://cotisolar.com)',
      Accept: 'application/json',
    },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Photon respondió ${response.status}`);
  }
  const json = (await response.json()) as { features?: PhotonFeature[] };
  return json.features ?? [];
}

export async function searchPhoton(query: string): Promise<GeocodeResult[]> {
  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '6');
  const features = await photonFetch(url.toString());
  return features.map(mapFeature).filter((result) => Number.isFinite(result.lat) && Number.isFinite(result.lng));
}

export async function reversePhoton(lat: number, lng: number): Promise<GeocodeResult[]> {
  const url = new URL('https://photon.komoot.io/reverse');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  const features = await photonFetch(url.toString());
  return features.map(mapFeature).slice(0, 1);
}
