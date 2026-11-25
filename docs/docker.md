# Docker — CotiSolar

Guía para construir y ejecutar CotiSolar con Docker y Docker Compose.

> Verificado el 2026-11-25 con Node 24, Next.js 16 y salida `standalone`.

## 1. Arquitectura

```
Dockerfile multi-stage
├─ deps:    node:24.21.0-bookworm-slim
│            npm ci
├─ builder: node:24.21.0-bookworm-slim
│            next build (output: standalone)
└─ runner:  node:24.21.0-bookworm-slim
             .next/standalone + .next/static + public
             usuario no-root nextjs
             Next en :3000
```

- El contenedor escucha en **3000**; Compose publica `${APP_PORT:-3001}`.
- La imagen no contiene `.env`, claves ni secretos.
- `public/brand` y `public/maplibre-gl-worker.mjs` se copian para PDF y mapa.
- Healthcheck: `GET /api/health`.

## 2. Requisitos

- Docker Engine/Desktop con Compose v2.
- Puerto libre (3001 por defecto).
- No se requiere API key.

## 3. Puesta en marcha

```bash
cp .env.example .env       # opcional
docker compose up -d --build
```

Abrir <http://localhost:3001/>.

Verificar:

```bash
docker compose ps
curl http://localhost:3001/api/health
curl -I http://localhost:3001/
```

Esperado:

```json
{"status":"ok","version":"0.2.0","timestamp":"..."}
```

Detener:

```bash
docker compose down
```

## 4. Variables

| Variable | Default | Secreto | Uso |
|---|---|---|---|
| `APP_URL` | `http://localhost:3001` | No | Metadata/enlaces absolutos. |
| `APP_PORT` | `3001` | No | Puerto del host. |
| `GEOCODER_PROVIDER` | `photon` | No | `photon` o `google`. |
| `GOOGLE_MAPS_API_KEY` | vacío | **Sí** | Solo si Google está activo. |
| `PORT` | `3000` | No | Interno del contenedor. |
| `HOSTNAME` | `0.0.0.0` | No | Bind interno. |

`.env` está en `.gitignore` y `.dockerignore`; `.env.example` se versiona.

## 5. Build manual

```bash
docker build -t cotisolar:local .
docker run --rm -p 3001:3000 -e APP_URL=http://localhost:3001 cotisolar:local
```

## 6. Operación

```bash
docker compose logs -f
docker compose restart
docker compose down
docker compose up -d --build
```

## 7. Troubleshooting

| Problema | Solución |
|---|---|
| `port is already allocated` | Cambiar `APP_PORT` o liberar 3001. |
| Contenedor `unhealthy` | `docker compose logs`; verificar `/api/health`. |
| PDF sin logo | Verificar que `public/brand/*.png` esté en la imagen. |
| Mapa en blanco | El navegador debe acceder a OpenFreeMap; el worker debe existir. |
| Fotón/PVGIS sin red | La app cae a coordenadas/HSP manual. |
| Build lento | Primera descarga de Node/npm; luego cachea capas. |

## 8. Seguridad

- Usuario no-root.
- `no-new-privileges`.
- Sin secretos en la imagen.
- La clave de Google se inyecta por entorno y se usa server-side.
- Rotar la clave histórica de Google fuera del repositorio.

## 9. Limpieza

```bash
docker compose down --volumes --remove-orphans
docker image rm cotisolar:local
```
