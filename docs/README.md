# Documentación — CotiSolar

Índice técnico y funcional de **CotiSolar** (repositorio `SolarCalculator`, paquete
`cotisolar`).

> **Producto:** CotiSolar · **Slogan:** “CotiSolar: la cuenta que cierra.”
>
> **Estado:** migración a Next.js 16 completada. La app CRA 1 + Restify quedó archivada
> en el tag `legacy-cra-2026-11`.

## Identidad

| Campo | Valor |
|---|---|
| Nombre | **CotiSolar** |
| Slogan | **CotiSolar: la cuenta que cierra.** |
| Concepto | **El sol que cierra la cuenta.** |
| Repositorio / paquete | `SolarCalculator` / `cotisolar` |
| Idioma | Español |
| PWA | Manifest e iconos en `app/`; sin service worker en v1 |

## Documentos

| Documento | Para qué sirve |
|---|---|
| [Stack, arquitectura e instalación](./analysis-frontend.md) | Versiones, estructura, APIs, comandos, troubleshooting. |
| [Producto, dominio y fórmulas](./analisis-producto.md) | Flujo, modelo, cálculos, radiación y caso golden. |
| [Marca](./marca.md) | Logo, colores, tipografía, aplicaciones y tono. |
| [Docker](./docker.md) | Build, Compose, variables, healthcheck y operación. |
| [Roadmap](./roadmap.md) | Hecho, próximos pasos y fuera de alcance. |
| [AGENTS.md](../AGENTS.md) | Guía operativa para agentes. |
| [CLAUDE.md](../CLAUDE.md) | Puntero a `AGENTS.md`. |
| [README.md](../README.md) | Inicio rápido. |

## Resumen

- **Next.js 16.4.6 + React 19 + TypeScript 5.9.3 + Tailwind 4**.
- Wizard de 6 pasos: ubicación/radiación → consumo → paneles → baterías → equipos →
  resumen.
- **PVGIS 5.3** para irradiación en plano inclinado e inclinación óptima; **NASA POWER**
  como fallback; HSP manual como último recurso.
- **Photon + MapLibre/OpenFreeMap** para ubicación; Google es opcional.
- **Zustand + localStorage** (`cotisolar:project:v1`); sin base de datos ni auth.
- **PDF** con `@react-pdf/renderer`; **Excel** con ExcelJS; ambos server-side.
- **Node 24**, salida standalone y Docker multi-stage; healthcheck `/api/health`.
- La app funciona **sin claves de API**.

## Inicio rápido

### Docker

```bash
cp .env.example .env       # opcional
docker compose up -d --build
```

Abrir <http://localhost:3001/>. Detalle: [docker.md](./docker.md).

### Local

```bash
npm ci
npm run dev
```

Abrir <http://localhost:3000/>.

### Verificación

```bash
npm run verify   # lint + typecheck + tests + build
```

## Caso golden

Buenos Aires, 16 paneles de 80 W manuales:

| Indicador | Valor |
|---|---:|
| Consumo invierno / verano | 1.570 / 1.325 Wh/día |
| Energía total a generar | 3.454 Wh/día |
| Banco | 432,65 Ah |
| Baterías | 4 × 220 Ah (2s × 2p) |
| Corriente de carga | 50,1 A |
| Corriente de descarga | 19,47 A |
| Equipos | USD 9.280,21 |
| Total con instalación | USD 12.680,21 |

La radiación del ejemplo es PVGIS-SARAH3: 5,05 kWh/m²/día a 49° y 5,25 a la inclinación
óptima de 32°. Puede diferir de la tabla NASA SSE histórica; la UI y los reportes
muestran la fuente.

## Fuentes de verdad

| Tema | Fuente |
|---|---|
| Fórmulas | [`domain/calculations.ts`](../domain/calculations.ts) |
| Golden | [`tests/unit/calculations.test.ts`](../tests/unit/calculations.test.ts) |
| Esquema | [`domain/schemas.ts`](../domain/schemas.ts) |
| Marca | [marca.md](./marca.md) + [`brand/`](../brand/README.md) |
| Deploy | [`Dockerfile`](../Dockerfile) + [`docker-compose.yml`](../docker-compose.yml) |
| Versiones | [`package.json`](../package.json) / `package-lock.json` |

## Mantenimiento

- Actualizar la fecha/estado cuando cambie el stack.
- Si cambia una fórmula, actualizar tests y [análisis de producto](./analisis-producto.md).
- Si cambia la marca, actualizar [marca.md](./marca.md) y assets.
- No incluir claves, tokens ni datos personales.
