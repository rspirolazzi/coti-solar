import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CotiSolar — Dimensionamiento fotovoltaico',
    short_name: 'CotiSolar',
    description: 'Dimensionamiento y presupuestos de sistemas solares fotovoltaicos.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F6F1E7',
    theme_color: '#0C2233',
    lang: 'es',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
