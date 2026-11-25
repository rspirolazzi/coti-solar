# Producto, dominio y cálculos — CotiSolar

> Actualizado: 2026-11-25. Describe la app Next.js actual; la versión CRA/Restify está
> archivada en el tag `legacy-cra-2026-11`.

## 1. Qué hace

CotiSolar dimensiona un sistema fotovoltaico autónomo (off-grid) y estima el presupuesto
de equipos. El usuario carga ubicación/radiación, consumos, paneles, baterías,
regulador e inversor; la app calcula cantidades, corrientes, cobertura y costos, y
exporta PDF/Excel.

No es marketplace, no monitorea equipos, no tiene cuentas ni base de datos.

## 2. Flujo

1. **Ubicación y radiación:** búsqueda con Photon, mapa MapLibre/OpenFreeMap, coordenadas,
   geolocalización; PVGIS mensual; inclinación óptima/elegida; HSP manual.
2. **Consumo:** artefactos, cantidad, W, horas invierno/verano; factor de potencia,
   seguridad, eficiencia, días nublados/frecuencia.
3. **Paneles:** modelo eléctrico, precio, cantidad automática o manual; generación
   mensual vs. consumo.
4. **Baterías:** autonomía + reserva, DoD, eficiencias, tensión, modelo; banco, cantidad,
   serie/paralelo, C5/C20.
5. **Equipos:** reguladores, corriente requerida, inversor, potencia pico.
6. **Resumen:** KPIs, advertencias, costos, PDF/Excel.

## 3. Modelo

Ver [`domain/types.ts`](../domain/types.ts) y [`domain/schemas.ts`](../domain/schemas.ts).

- `ProjectDraft` con `schemaVersion: 1`.
- `location`: etiqueta, lat/lng, elevación, país/provincia, fuente y `radiation`.
- `radiation`: proveedor, base, período, inclinación, orientación, 12 HSP, óptima,
  promedio anual, timestamp.
- `consumption`: ítems + supuestos.
- `panels`: ítems + cantidad auto/manual.
- `battery`: modelo + autonomía/reserva + eficiencias + tensión.
- `equipment`: reguladores + inversor.
- `costs`: extras + margen + USD.

El estado se guarda en `localStorage` (`cotisolar:project:v1`). No se persisten totales.

## 4. Fórmulas

La fuente ejecutable es [`domain/calculations.ts`](../domain/calculations.ts).

### Consumo

```
inviernoWh = Σ qty × W × hsInvierno
veranoWh   = Σ qty × W × hsVerano
maxWh      = max(inviernoWh, veranoWh)
energia    = maxWh × factorSeguridad / eficienciaSistema
extra      = energia × diasNublados / frecuencia
total      = energia + extra
```

Con el ejemplo: `1570 × 110 / 60 = 2878,33`; extra `575,67`; total `3454`.

### Paneles

```
demandaAjustada = maxWh × factorSeguridad
panelDiario(mes) = P × HSP(mes) × derateSistema
requeridos = max_mes(ceil(demandaAjustada / panelDiario(mes)))
qty = manual ? override : requeridos
serie = ceil(Vsistema / Vmp)
paralelo = ceil(qty / serie)
```

- `derateSistema = eficienciaSistema / 100` (ej. 60%).
- Si la cantidad manual es menor a la requerida, se emite warning.
- Todos los paneles del arreglo deben compartir modelo eléctrico.

### Baterías

```
bancoAh = maxWh × (autonomia + reserva) / (V × DoD × ηdesc × ηinv)
qty = ceil(bancoAh × V / (AhBateria × Vbateria))
serie = ceil(V / Vbateria)
paralelo = ceil(qty / serie)
capacidad = AhBateria × paralelo
cargaMax = 1,25 × paraleloPaneles × Isc
descargaMax = potenciaTotal / FP / (V × ηinv)
```

- `reserveDays` es explícito (default 1); no hay `+1` mágico.
- El ejemplo da 432,65 Ah → 4 baterías (2s × 2p).

### Equipos

```
reguladorA = 1,25 × paraleloPaneles × Isc
inversorVA = potenciaTotal × 1,25 / FP
picoA = potenciaPico / (220 × FP)
```

Se comparan con la suma de reguladores y con la continua/pico del inversor.

### Costos

```
paneles + baterías + reguladores + inversor = equipos
equipos + extras + margen = total
```

Se redondea por componente (2 decimales) para que el total coincida con la suma mostrada.
En el ejemplo: equipos USD 9.280,21; extras USD 3.400; total USD 12.680,21.

## 5. Radiación

### PVGIS (principal)

- `PVcalc` v5.3, `peakpower=1`, `loss=14`, `usehorizon=1`.
- Sin inclinación: `optimalinclination=1`, `aspect` al ecuador (`0` norte,
  `-180` sur).
- Con inclinación: `angle` + `aspect`.
- `H(i)_d` mensual (kWh/m²/día); `H(i)_y` anual.
- Base y período visibles (`PVGIS-SARAH3`, 2005–2023 en Buenos Aires).
- Atribución: “PVGIS © European Union, 2001–2026”.
- Caché 30 días; rate limit 20/min; timeout 15 s.

### NASA POWER (fallback)

- GHI horizontal mensual en kWh/m²/día (unidad nativa de NASA POWER).
- Se identifica como `NASA POWER (horizontal)`; no es plano inclinado.
- Si PVGIS y NASA fallan, la UI permite HSP manual.

### Comparación con la tabla histórica

La planilla original usaba NASA SSE a 49°: ~4,75 kWh/m²/día. PVGIS-SARAH3 devuelve 5,05 a
49° y 5,25 a 32° para Buenos Aires. Son fuentes/períodos distintos; la app muestra la
fuente y no presenta el número como verdad absoluta. El usuario puede cambiar la
inclinación o cargar HSP manual.

## 6. Caso golden

Proyecto [`createExampleProject()`](../domain/defaults.ts), test
[`tests/unit/calculations.test.ts`](../tests/unit/calculations.test.ts).

| Indicador | Valor |
|---|---:|
| Consumo invierno | 1.570 Wh/día |
| Consumo verano | 1.325 Wh/día |
| Energía a generar | 2.878,33 Wh/día |
| Energía total | 3.454 Wh/día |
| Banco | 432,65 Ah |
| Baterías | 4 × 220 Ah, 2s × 2p, 440 Ah |
| Carga máxima | 50,1 A |
| Descarga máxima | 19,47 A |
| Regulador requerido | 50,1 A |
| Inversor requerido | 491,07 VA |
| Paneles manuales | 16 × 80 W = 1.280 W |
| Paneles requeridos | 10 (con HSP del ejemplo) |
| Equipos | USD 9.280,21 |
| Total con instalación | USD 12.680,21 |

## 7. Supuestos y advertencias

- Una marca eléctrica de panel por arreglo (varias filas solo si comparten modelo).
- Un modelo de batería; múltiples reguladores.
- Moneda USD; sin IVA ni tipo de cambio.
- Sin auth, historial ni base de datos.
- Los valores son estimaciones; deben validarse profesionalmente.
- El PDF usa Helvetica (no Sora/Inter) por limitaciones de fuentes; la UI usa la
  tipografía de marca.

## 8. Límites conocidos

- Sin migración automática de `persist:root` legacy; sí import/export JSON.
- Sin catálogo administrable de equipos/precios.
- Sin i18n/multi-moneda.
- Sin service worker/offline avanzado.
- Google Places no implementado; Google Geocoding opcional.
- NASA fallback horizontal.
- MapLibre/OpenFreeMap dependen de red; hay fallback a coordenadas.
- Las tareas de dominio/INPI están fuera de alcance por decisión del producto.
