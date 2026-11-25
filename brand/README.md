# Assets de marca — CotiSolar

Archivos de trabajo de la identidad visual. Esta carpeta contiene las **fuentes
editables** (texto Sora/Inter); los archivos finales outlinados, favicon e iconos PWA
están en [`production/`](./production/README.md), y las plantillas en
[`templates/`](./templates/README.md).

| Archivo | Uso |
|---|---|
| `cotisolar-isologo.svg` | Versión principal horizontal (símbolo + marca). |
| `cotisolar-isologo-reverso.svg` | Versión para fondos oscuros (transparente). |
| `cotisolar-isologo-reverso-preview.svg` / `.png` | Reverso sobre fondo Azul Tinta, para presentaciones. |
| `cotisolar-isologo-apilado.svg` | Versión cuadrada/apilada para avatares y sellos. |
| `cotisolar-marca.svg` | Solo marca (wordmark) con punto ámbar. |
| `cotisolar-simbolo.svg` | Isotipo: la C con sol. |
| `cotisolar-app-icon.svg` | Icono de aplicación 512 × 512. |
| `cotisolar-brand-board.svg` | Tablero resumen de identidad y paleta. |
| `cotisolar-*.png` | Previews PNG de los SVG, para documentación y revisión. |

> Los PNG de esta carpeta se renderizaron con la fuente de fallback disponible en el
> entorno. Los assets de producción usan Sora outlinada.

## Producción y plantillas

- [`production/`](./production/README.md): SVG outlinados, `favicon.ico`, favicons PNG,
  Apple touch icon y PWA 192/512.
- [`templates/`](./templates/README.md): portada y resultados de reporte, LinkedIn,
  cuadrado y firma de email.

Pendientes:

- Revisar el dibujo de la “C” con un diseñador.
- Probar el isotipo en dispositivos reales (ya validado en raster a 16–64 px).
- Validar contraste y usos sobre foto.
- Probar la instalación PWA en dispositivos reales (manifest, iconos y service worker).

Guía completa: [`docs/marca.md`](../docs/marca.md).
