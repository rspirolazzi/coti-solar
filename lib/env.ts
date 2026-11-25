import 'server-only';

export const env = {
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY?.trim() || '',
  geocoderProvider: (process.env.GEOCODER_PROVIDER || 'photon').toLowerCase(),
  appUrl: process.env.APP_URL || 'http://localhost:3001',
};
