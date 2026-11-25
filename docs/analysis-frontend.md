# Stack, arquitectura e instalación — CotiSolar

> Actualizado: 2026-11-25. Reemplaza el análisis de la app CRA/Restify, archivada en el
> tag `legacy-cra-2026-11`.

## 1. Versiones

| Área | Tecnología | Versión |
|---|---|---:|
| Framework | Next.js (App Router, Turbopack) | 16.4.6 |
| UI | React / React DOM | 19.3.1 |
| Lenguaje | TypeScript | 5.9.3 |
| Runtime | Node.js | 24.21.0 |
| Estilos | Tailwind CSS + `@tailwindcss/postcss` | 4.3.5 |
| Primitivas | Radix UI | últimas estables |
| Estado | Zustand + persist | 5.1.0 |
| Validación | Zod | 4.6.7 |
| Gráficos | Recharts | 3.11.1 |
| Mapas | MapLibre GL JS | 6.19.0 |
| PDF | `@react-pdf/renderer` | 4.9.1 |
| Excel | ExcelJS | 4.4.0 |
| Tests | Vitest / Testing Library / Playwright | 5.1.2 / 16.3.3 / 1.65.1 |

**TypeScript 5.9.3:** `typescript-eslint@8` soporta `<6.1`; TS 7 rompe el lint tipado.

## 2. Arquitectura

```
Navegador
  Next App Router (RSC shell + client wizard)
  Zustand + localStorage
  MapLibre + OpenFreeMap
        │
        ▼
Route Handlers (Node runtime)
  /api/geocode    → Photon (default) / Google (opcional)
  /api/radiation  → PVGIS 5.3 → NASA POWER → error/manual
  /api/reports/*  → recalcula dominio → PDF / XLSX
        │
        ▼
Servicios externos
  PVGIS (JRC), NASA POWER, Photon, OpenFreeMap
```

- No hay base de datos ni autenticación.
- El servidor no guarda proyectos; los reportes se generan a partir del draft enviado.
- El cliente nunca recibe claves.

## 3. Estructura

```
app/
  layout.tsx / page.tsx / globals.css
  manifest.ts / icon.png / apple-icon.png
  calculadora/{ubicacion,consumo,paneles,baterias,equipos,resumen}
  api/{health,geocode,radiation,reports/pdf,reports/xlsx}
components/
  brand/ ui/ wizard/ map/ charts/ landing/
domain/
  types.ts schemas.ts calculations.ts defaults.ts
lib/
  store.ts providers/ reports/ format.ts cn.ts steps.ts
tests/
  unit/ e2e/
public/
  brand/ icons/ maplibre-gl-worker.mjs
```

## 4. APIs

### `GET /api/health`

```json
{ "status": "ok", "version": "0.2.0", "timestamp": "..." }
```

### `GET /api/geocode?q=...` o `?lat=&lng=`

- Photon: `https://photon.komoot.io/api` y `/reverse`; sin clave; no enviar `lang=es`.
- Google opcional: `GEOCODER_PROVIDER=google` + `GOOGLE_MAPS_API_KEY`; si falla, Photon.
- Rate limit 30/min; caché 24 h.

### `GET /api/radiation?lat=&lon=&tilt=&azimuth=`

- PVGIS `PVcalc` v5.3.
- Sin `tilt`: `optimalinclination=1` y `aspect` al ecuador.
- Con `tilt`: `angle` + `aspect`.
- Devuelve `monthlyHsp`, `optimalTiltDeg`, `database`, `period`, `annualAverage`.
- Rate limit 20/min; caché 30 días; timeout 15 s.
- Fallback NASA POWER (horizontal); si falla, 502 y la UI ofrece HSP manual.

### `POST /api/reports/pdf` y `/xlsx`

- Body: `ProjectDraft`; validado con Zod.
- El servidor recalcula y genera el archivo.
- Límite 256 KB y 5/min.
- `Cache-Control: no-store`.

## 5. Estado

- Clave `cotisolar:project:v1`.
- `skipHydration` + `StoreHydrator` para evitar desajustes SSR.
- `partialize` guarda solo `project`.
- Acciones: nuevo, ejemplo, reemplazar, actualizar, nombre, ubicación, radiación.
- Import/export JSON en el menú del proyecto.

## 6. Instalación

Requisitos: Node 24 y npm 11.

```bash
npm ci
npm run dev
```

Build de producción:

```bash
npm run build
npm run start
```

Docker:

```bash
docker compose up -d --build
```

## 7. Comandos

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run verify
```

## 8. Variables

| Variable | Default | Secreto | Uso |
|---|---|---|---|
| `APP_URL` | `http://localhost:3001` | No | URL pública/metadata. |
| `APP_PORT` | `3001` | No | Puerto del host en Compose. |
| `GEOCODER_PROVIDER` | `photon` | No | `photon` o `google`. |
| `GOOGLE_MAPS_API_KEY` | vacío | **Sí** | Solo Google; server-side. |

No hay claves obligatorias. `.env` está ignorado; `.env.example` se versiona.

## 9. Testing

- `npm test`: dominio, schemas, providers (fetch mockeado), reportes.
- `npm run test:e2e`: flujo, ubicación/coordenadas, recarga, descargas, mobile.
- PDF se prueba en entorno Node; el logo se omite en tests por diferencias de
  `pdfkit` en jsdom.
- Golden en `tests/unit/calculations.test.ts`.

## 10. Troubleshooting

| Problema | Causa / solución |
|---|---|
| La landing queda vacía | El store no hidrató: revisar localStorage/consola; `StoreHydrator` fuerza el estado a los 400 ms. |
| Photon 502 | Photon caído o rate limit; usar coordenadas o Google opcional. |
| PVGIS 502 | Cobertura/red; la UI permite HSP manual. |
| Mapa en blanco | OpenFreeMap/WebGL bloqueado; usar búsqueda/coordenadas. |
| Worker de MapLibre | Debe existir `public/maplibre-gl-worker.mjs`; si se actualiza MapLibre, copiarlo. |
| PDF sin logo | Verificar `public/brand/*.png`; el PDF usa data URI. |
| Docker no healthy | Revisar `docker compose logs`; `/api/health` debe responder. |
| Next en otro puerto | 3000 ocupado; Next elige 3001. En Docker el host sigue siendo 3001. |

## 11. Seguridad

- Sin claves en el cliente; Google solo server-side.
- CSP report-only; `X-Frame-Options: DENY`.
- Rate limit y validación Zod.
- La clave histórica de Google debe rotarse (acción externa).
- No se guardan direcciones ni datos personales en servidor.

## 12. Decisiones

- **Tailwind + Radix** en lugar de MUI: mejor encaje de marca y menos runtime.
- **PVGIS** en lugar de NASA SSE: fuente vigente y plano inclinado directo.
- **Photon + OpenFreeMap** para no exigir API key.
- **Zustand** en lugar de Redux: menos boilerplate.
- **Server-side reports** para no confiar en totales del cliente.
- **TS 5.9.3** por compatibilidad con `typescript-eslint`.
