export interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
  country?: string;
  admin1?: string;
}

export interface GeocodeResponse {
  results: GeocodeResult[];
  source: 'photon' | 'google' | 'manual';
}

export interface RadiationMonth {
  month: number;
  hsp: number;
}

export interface RadiationResponse {
  provider: 'pvgis' | 'nasa';
  database: string;
  period: string;
  tiltDeg: number;
  azimuthDeg: number;
  monthlyHsp: number[];
  optimalTiltDeg?: number;
  annualAverage: number;
  fetchedAt: string;
}

export interface RadiationRequest {
  lat: number;
  lng: number;
  tiltDeg?: number;
  azimuthDeg?: number;
}
