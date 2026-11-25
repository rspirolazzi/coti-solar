# Producción — CotiSolar

Assets finales para usar en web, app, reportes y redes. A diferencia de los archivos de
`brand/` (fuentes editables), estos SVG tienen la tipografía **outlinada**.

| Archivo | Uso |
|---|---|
| `cotisolar-isologo.svg` | Isologotipo horizontal principal. |
| `cotisolar-isologo-reverso.svg` | Sobre fondos oscuros (transparente). |
| `cotisolar-isologo-reverso-preview.svg` | Reverso sobre Azul Tinta para presentaciones. |
| `cotisolar-isologo-apilado.svg` | Avatar, sello y formatos cuadrados. |
| `cotisolar-marca.svg` | Solo wordmark. |
| `cotisolar-simbolo.svg` | Isotipo para favicon/watermark. |
| `cotisolar-app-icon.svg` | Icono de app 512 × 512. |
| `favicon.ico` | Favicon multi-size (16/32/48). |
| `favicon-16.png`, `favicon-32.png`, `favicon-48.png` | Favicons PNG. |
| `apple-touch-icon.png` | iOS 180 × 180. |
| `pwa-192.png`, `pwa-512.png` | PWA/Android. |
| `manifest.example.json` | Ejemplo de manifest PWA con nombre, colores e iconos. |
| `icon-*.png` | Exportaciones auxiliares. |
| `cotisolar-*.png` | Previews de los SVG. |

## Integración en la app

Ya están integrados:

- `public/favicon.ico`
- `public/apple-touch-icon.png`
- `public/pwa-192.png`
- `public/pwa-512.png`
- `public/manifest.json`
- Rutas de Restify para servir esos archivos en producción.

Pendiente: probar la instalación PWA en Android/iOS y el comportamiento offline del
service worker.

Los archivos se generaron desde el símbolo y los SVG outlinados. No editar los SVG de
producción a mano: regenerarlos desde las fuentes de `brand/`.
