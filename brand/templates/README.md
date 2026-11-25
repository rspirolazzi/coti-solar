# Plantillas de marca — CotiSolar

Plantillas editables para reportes y redes. Usan Sora/Inter y el sistema de color de
[`docs/marca.md`](../../docs/marca.md). Las previews están en `preview/`.

| Archivo | Formato | Uso |
|---|---|---|
| `reporte-portada.svg` | A4 vertical (794 × 1123 px) | Portada de reporte: cliente, ubicación, fecha y resumen. |
| `reporte-resultados.svg` | A4 vertical | Resultados, sistema y presupuesto de equipos. |
| `social-linkedin.svg` | 1200 × 627 px | Post/portada para LinkedIn. |
| `social-cuadrado.svg` | 1080 × 1080 px | Post cuadrado para Instagram/LinkedIn. |
| `firma-email.html` | HTML | Firma de email con logo y datos. |

## Cómo usarlas

1. Abrir el SVG en Figma, Illustrator, Inkscape o Affinity.
2. Reemplazar los `—` y los textos guía por los datos reales.
3. Para el logo, usar los archivos de [`../production/`](../production/README.md)
   (outlinados) o el componente de marca, no reescribir el logotipo.
4. Exportar:
   - Reporte: PDF A4, 300 dpi si lleva imágenes, con fuentes embebidas/outlinadas.
   - Redes: PNG/JPG al tamaño exacto; LinkedIn 1200 × 627; cuadrado 1080 × 1080.
   - Firma: HTML con el logo en una URL absoluta (`https://cotisolar.com/...`).

## Reglas

- Mantener la jerarquía: título en Sora, cuerpo en Inter, números tabulares.
- No usar ámbar como texto sobre blanco; sí como acento, fondo de CTA o dato.
- No inventar variantes del símbolo ni cambiar el punto ámbar.
- Probar el reporte en blanco y negro: la información no puede depender solo del color.
- El reporte debe incluir fecha, datos de entrada y supuestos, no solo resultados.

## Nota de producción

Las plantillas usan texto editable (no outlinado) para poder completarlas. Al cerrar el
documento final, outlinear las fuentes o embeberlas en el PDF. Los logos de
`brand/production/` ya están outlinados.
