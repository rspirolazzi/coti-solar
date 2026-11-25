# Roadmap — CotiSolar

> Actualizado: 2026-11-25. La app CRA/Restify anterior está archivada en el tag
> `legacy-cra-2026-11`.

## Hecho

- Migración a **Next.js 16 + React 19 + TypeScript 5.9.3**.
- UI propia con **Tailwind 4 + Radix**, identidad CotiSolar.
- Wizard de 6 pasos: ubicación, consumo, paneles, baterías, equipos, resumen.
- **PVGIS 5.3** con inclinación óptima y mensual; **NASA POWER** fallback; HSP manual.
- **Photon + MapLibre/OpenFreeMap**; Google opcional; sin clave obligatoria.
- Cálculos corregidos: paneles ponderados, baterías con `ceil`, reserva explícita,
  regulador/inversor, validaciones.
- **PDF** y **Excel** server-side.
- **Docker Node 24** multi-stage, standalone, non-root y healthcheck.
- Tests de dominio, providers y reportes; golden de Buenos Aires.
- Documentación y marca integradas.

## Próximos pasos

### P0 — Confiabilidad

- Probar el flujo completo en **mobile real** (iOS/Android) y mapas.
- Probar PVGIS/Photon/OpenFreeMap con red lenta y caída; ajustar mensajes.
- Rotar la clave histórica de Google (acción externa).
- Revisar CSP y headers en producción con HTTPS.
- Agregar E2E de import/export JSON y migración legacy.

### P1 — Producto

- Catálogo administrable de paneles/baterías/reguladores/inversores.
- Historial local de cálculos (múltiples proyectos) y “duplicar”.
- Mapa estático/portada en PDF (con atribución).
- Comparativa de escenarios (autonomía, inclinación, cantidad de paneles).
- Validación de strings PVGIS por temperatura y compatibilidad de inversor.
- Multi-moneda/IVA/margen por categoría.

### P2 — Escala

- Autenticación y guardado en servidor (si el producto lo pide).
- Compartir por link y colaboración.
- Catálogo remoto/precios.
- PWA offline y service worker.
- Observabilidad y métricas de proveedores.

## Fuera de alcance (v1)

- Marketplace, monitoreo de equipos, pagos.
- i18n, multi-usuario, base de datos.
- Mapas offline, app nativa.
- Tareas de dominio/INPI (decisión de producto).

## Criterios de aceptación

- `npm run verify` pasa.
- Docker healthy y `/api/health` OK.
- Flujo completo con ubicación por mapa y coordenadas.
- PDF/Excel con fuente de radiación y supuestos.
- Golden estable.
- Sin claves obligatorias ni secretos en la imagen.
