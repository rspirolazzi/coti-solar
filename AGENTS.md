# AGENTS.md — Guía operativa de CotiSolar

Guía para agentes de código que trabajen en **CotiSolar** (repositorio
`SolarCalculator`, paquete `cotisolar`). Leer antes de modificar el repositorio.

- **Producto:** CotiSolar.
- **Slogan:** **CotiSolar: la cuenta que cierra.**
- **Idioma de UI y documentación:** español.
- **Estado:** migración a Next.js 16 completada; la app CRA/Restify anterior quedó en el
  tag `legacy-cra-2026-11`.
- **Fecha de esta guía:** 2026-11-25.

## 1. Qué hace

Aplicación web para dimensionar un sistema solar fotovoltaico autónomo (off-grid) y
estimar el presupuesto de equipos. El flujo es:

1. Ubicación y radiación (mapa, búsqueda, coordenadas, PVGIS).
2. Consumo y energía.
3. Paneles.
4. Baterías.
5. Regulador e inversor.
6. Resumen, advertencias y PDF/Excel.

No es marketplace, no monitorea equipos, no tiene cuentas ni base de datos. El borrador
vive en `localStorage`.

## 2. Stack

| Área | Tecnología |
|---|---|
| Framework | Next.js 16.4.6 (App Router, Turbopack, `output: 'standalone'`) |
| UI | React 19.3.1, Tailwind CSS 4.3.5, Radix UI, kit interno |
| Lenguaje | TypeScript 5.9.3 (no subir a TS 7: `typescript-eslint@8` soporta `<6.1`) |
| Runtime | Node.js 24.21.0 |
| Estado | Zustand 5.1.0 + `persist` (`cotisolar:project:v1`) |
| Formularios/validación | Zod 4.6.7; formularios controlados |
| Gráficos | Recharts 3.11.1 |
| Mapas | MapLibre GL JS 6.19.0 + OpenFreeMap |
| Radiación | PVGIS 5.3 (principal), NASA POWER (fallback) |
| Geocoding | Photon (default), Google opcional |
| Reportes | `@react-pdf/renderer` 4.9.1, ExcelJS 4.4.0 |
| Tests | Vitest 5.1.2, Testing Library, Playwright 1.65.1 |

No agregar Material-UI, Redux, Axios, Restify ni CRA.

## 3. Comandos

```bash
npm ci               # instalar
npm run dev          # Next dev (3000 o el siguiente libre)
npm run build        # build standalone
npm run start        # producción local
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm test             # Vitest
npm run test:e2e     # Playwright
npm run verify       # lint + typecheck + tests + build
```

Docker:

```bash
docker compose up -d --build
docker compose ps
curl http://localhost:3001/api/health
docker compose down
```

- Contenedor: `3000`; host: `${APP_PORT:-3001}`.
- La imagen no contiene `.env`, claves ni secretos.
- El healthcheck usa `/api/health`.

## 4. Estructura

```
app/
  page.tsx                     landing
  calculadora/                 wizard de 6 pasos
  api/health/                  healthcheck
  api/geocode/                 Photon/Google
  api/radiation/               PVGIS/NASA
  api/reports/pdf|xlsx/        reportes server-side
components/
  brand/                       logo
  ui/                          kit interno
  wizard/                      shell y pasos
  map/                         MapLibre
  charts/                      Recharts
domain/
  types.ts                     tipos de dominio
  schemas.ts                   Zod
  calculations.ts              fórmulas puras
  defaults.ts                  proyecto nuevo y ejemplo
lib/
  store.ts                     Zustand + persist
  providers/                   Photon, Google, PVGIS, NASA
  reports/                     PDF y Excel
  format.ts, cn.ts, steps.ts
tests/
  unit/                        dominio y providers
  e2e/                         flujos
public/
  brand/                       logos para UI/PDF
  icons/                       PWA
  maplibre-gl-worker.mjs       worker de MapLibre
Dockerfile
docker-compose.yml
```

## 5. Dominio y fórmulas

La fuente funcional es [`domain/calculations.ts`](./domain/calculations.ts) y el caso
golden de [`tests/unit/calculations.test.ts`](./tests/unit/calculations.test.ts).

| Cálculo | Fórmula |
|---|---|
| Consumo invierno/verano | `Σ qty × W × horas` |
| Energía a generar | `max(invierno, verano) × 110 / 60` |
| Energía extra | `energía × díasNublados / frecuencia` |
| Banco | `E × (autonomía + reserva) / (V × DoD × ηdesc × ηinv)` |
| Baterías | `ceil(bancoAh × V / (Ah × Vbat))`, serie/paralelo |
| Paneles requeridos | `ceil(demandaAjustada / (P × HSP × derate))` por mes |
| Corriente regulador | `1,25 × paralelo × Isc` |
| Inversor | `P × 1,25 / FP`; pico `Ppico / (220 × FP)` |
| Costos | suma de componentes + extras + margen, redondeando por componente |

Reglas:

- **No cambiar una fórmula sin test.** Mantener el golden o actualizarlo con
  justificación.
- La reserva de autonomía es explícita (`reserveDays`, default 1). No reintroducir el
  `+1` mágico.
- Los paneles del mismo arreglo deben compartir modelo eléctrico; el dominio lo valida.
- La cantidad manual puede ser menor a la requerida: se emite warning, no error.
- El dinero se redondea por componente; no usar strings de `toFixed`.
- Cualquier cambio de radiación debe documentar fuente, período e inclinación.

### Caso golden

- Consumo: 1.570 Wh/día invierno, 1.325 Wh/día verano.
- Energía total: 3.454 Wh/día.
- Banco: 432,65 Ah → 4 baterías de 220 Ah, 2 serie × 2 paralelo, 440 Ah.
- Corriente de carga: 50,1 A; descarga: 19,47 A.
- Equipos: USD 9.280,21; total con instalación: USD 12.680,21.
- Paneles: 16 × 80 W manuales; requeridos ≈ 10 con PVGIS del ejemplo.

## 6. Radiación y ubicación

### PVGIS

- `lib/providers/pvgis.ts`, endpoint `GET /api/radiation`.
- `PVcalc` v5.3; `peakpower=1`, `loss=14`, `usehorizon=1`.
- Sin inclinación: `optimalinclination=1` + `aspect` al ecuador (`0` norte,
  `-180` sur).
- Con inclinación: `angle` + `aspect`.
- Se usa `H(i)_d` mensual (kWh/m²/día); `H(i)_y` para el anual.
- Caché 30 días, timeout 15 s, rate limit 20/min.
- Atribución obligatoria: “PVGIS © European Union, 2001–2026”.
- No hay CORS: llamar solo desde el servidor.

### NASA POWER

- Fallback cuando PVGIS falla o no cubre el punto.
- Devuelve GHI horizontal en kWh/m²/día (unidad de NASA POWER). La UI lo identifica
  como `NASA POWER (horizontal)`; no es equivalente a un plano inclinado.
- Si ambos fallan, el usuario puede cargar HSP manual.

### Ubicación

- **Photon** (`https://photon.komoot.io`) para autocomplete y reverse; sin clave, uso
  justo. No enviar `lang=es` (Photon devuelve 400); omitir `lang`.
- **Google** opcional con `GEOCODER_PROVIDER=google` y `GOOGLE_MAPS_API_KEY`; si falla,
  se cae a Photon.
- **MapLibre + OpenFreeMap** para tiles; sin clave; atribución.
- El worker de MapLibre se sirve desde `/maplibre-gl-worker.mjs`. Si se actualiza
  `maplibre-gl`, copiar de nuevo `node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs`
  a `public/`.
- Si el mapa/WebGL falla, el flujo debe seguir por búsqueda y coordenadas.

## 7. Estado y API

- Store: `lib/store.ts`; clave `cotisolar:project:v1`; `skipHydration` + rehidratación
  en `components/StoreHydrator.tsx`.
- El proyecto se valida con `projectSchema` antes de exportar.
- APIs:
  - `GET /api/health`
  - `GET /api/geocode?q=...` o `?lat=&lng=`
  - `GET /api/radiation?lat=&lon=&tilt=&azimuth=`
  - `POST /api/reports/pdf`
  - `POST /api/reports/xlsx`
- Los reportes se generan en el servidor y **recalculan** el proyecto; no confiar en
  totales del cliente.
- Rate limits en memoria: geocode 30/min, radiation 20/min, reportes 5/min.
- Errores JSON `{ error: { code, message } }`.

## 8. Convenciones

- TypeScript estricto; no `any` salvo borde justificado.
- Componentes de UI en `components/`; dominio puro en `domain/`.
- Tailwind con tokens de marca; evitar CSS global nuevo.
- Textos de UI en español, tono claro y directo.
- Usar `next/image` para imágenes; `next/font` para Sora/Inter.
- No usar `window.location.href` para navegación interna; usar `Link`/`router.push`.
- No agregar dependencias sin justificación.
- Respetar [`docs/marca.md`](./docs/marca.md): colores, logo, tipografía y slogan.
- No crear tareas de dominio/INPI: están fuera de alcance por decisión del producto.

## 9. Testing

- `tests/unit/calculations.test.ts`: golden y fórmulas.
- `tests/unit/schemas.test.ts`: validación.
- `tests/unit/providers.test.ts`: PVGIS/NASA con `fetch` mockeado.
- `tests/unit/reports.test.ts`: PDF (3 páginas) y Excel (hojas/totales).
- `tests/e2e/`: flujo completo, mapa/coordenadas, recarga, descargas, mobile.
- PDF se prueba en entorno Node; el logo se omite en test para evitar diferencias de
  `pdfkit` en jsdom.
- Si se toca UI, ejecutar build y verificar en navegador; si se toca Docker, construir y
  probar `/api/health`.

## 10. Seguridad

- No commitear `.env`, claves ni tokens.
- La app funciona sin claves; Google es opcional.
- `GOOGLE_MAPS_API_KEY` solo en servidor; nunca `NEXT_PUBLIC_`.
- La clave histórica de Google debe rotarse en Google Cloud (acción externa).
- CSP en modo report-only; no abrir CORS.
- Validar cuerpo/query, limitar tamaño y rate limit.
- No registrar direcciones ni datos personales.

## 11. Docker

- Multi-stage Node 24, `npm ci`, `next build`, `standalone`.
- Usuario no-root `nextjs`; `EXPOSE 3000`.
- `docker compose` publica `3001` por defecto.
- `.dockerignore` excluye `.env`, `.next`, tests, docs, marca fuente y legacy.
- La imagen debe incluir `public/brand` (PDF) y `public/maplibre-gl-worker.mjs`.

## 12. Deuda y límites conocidos

- Sin autenticación, historial ni base de datos.
- Sin catálogo administrable de equipos/precios.
- Sin i18n ni multi-moneda.
- Sin service worker/offline avanzado.
- Google Places no implementado; Google Geocoding es opcional.
- NASA fallback es horizontal; no reemplaza PVGIS.
- MapLibre/OpenFreeMap dependen de red externa; hay fallback a coordenadas.
- El PDF usa Helvetica (no Sora/Inter) por limitaciones de fuentes; la UI sí usa la
  tipografía de marca.
- La migración de `persist:root` legacy no está implementada; el import/export JSON sí.

## 13. Definición de terminado

- [ ] `npm run verify` pasa.
- [ ] `npm run build` pasa con Node 24.
- [ ] Docker construye y `/api/health` responde.
- [ ] Tests nuevos/actualizados; golden sigue pasando o se justificó.
- [ ] Sin secretos ni `.env` en el diff.
- [ ] Documentación actualizada.
- [ ] Diff revisado; sin artefactos de debug.

## 14. Documentación

| Documento | Contenido |
|---|---|
| [docs/README.md](./docs/README.md) | Índice y estado. |
| [docs/analysis-frontend.md](./docs/analysis-frontend.md) | Stack, arquitectura, instalación y troubleshooting. |
| [docs/analisis-producto.md](./docs/analisis-producto.md) | Flujo, dominio, fórmulas, golden y límites. |
| [docs/marca.md](./docs/marca.md) | Identidad, logo, colores, tipografía y aplicaciones. |
| [docs/docker.md](./docs/docker.md) | Docker, variables y operación. |
| [docs/roadmap.md](./docs/roadmap.md) | Hecho y próximos pasos. |
| [README.md](./README.md) | Inicio rápido. |
| [CLAUDE.md](./CLAUDE.md) | Puntero a esta guía. |
