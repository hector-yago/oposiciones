# oposiciones

PWA personal para estudiar oposiciones de forma gamificada: respondes preguntas tipo test → ganas monedas → compras mascotas (que crecen con tus aciertos), herramientas y decoración para tu casa. Tema inicial: Constitución Española (CE); más temas después. Proyecto **nuevo**, contexto **personal**. Se instala en móvil (Android/iOS) desde GitHub Pages, sin tiendas, y se lanza en el PC desde My Tools. Plan completo: `docs/adr/0001-alcance-y-decisiones.md`.

## Stack y comandos
- JS plano modular (ES modules), **sin build ni dependencias**. Node 22 solo para tests, servidor local y e2e.
- `npm test` (unitarios, `node --test`) · `node tests/e2e/e2e.mjs [--shots=carpeta]` (Edge/Chrome headless por CDP; pendiente de portar de task-reminder) · `npm run icons` · `npm run version:sync`.
- Servidor local: `node serve.mjs [puerto]` (8097). My Tools lo arranca con `abrir-oposiciones.ps1` (`-Parar`, `-SoloComprobar`).

## Reglas de diseño
- Lógica de juego **pura** (`economy`, `scheduler`, `pets`, `achievements`, `stats`): sin DOM ni reloj; reciben «ahora» por parámetro.
- Persistencia: un único documento JSON (`js/store.js`) en IndexedDB. **Prohibido cambiar la forma de los datos sin migración + fixture + test** (`docs/datos-y-migraciones.md`).
- Preguntas: redactadas por nosotros a partir del texto oficial (BOE); **no copiar bancos de webs/academias** (copyright). Fuente en `docs/fuente-ce/`. Formato `{id, tema, titulo, articulo, enunciado, opciones[4], correcta, explicacion, dificultad}`; validadas por test (esquema, ids únicos, sin duplicados) y revisadas contra el BOE.
- Arte: SVG propio en código + animaciones CSS; sin imágenes externas.
- Sin castigos: las mascotas no mueren; sin herramienta solo crecen más despacio.
- Sin push, sin backend, sin telemetría. Datos solo en el dispositivo; export/import JSON + copias automáticas.
- Tema claro/oscuro con tokens CSS; interfaz en castellano; código en inglés.
- Usar siempre origen `localhost` (los datos de IndexedDB son por origen).

## Release (regla general del usuario; cada cambio)
1. Subir `version` en `package.json` y `npm run version:sync` (js/version.js y caché del `sw.js`).
2. Tests (+ e2e cuando exista) en verde.
3. Cerrar solo la instancia en marcha (`abrir-oposiciones.ps1 -Parar`); My Tools la lanza de nuevo.
4. Publicar: `git push` a `main` (repo `hector-yago/oposiciones`, GitHub Pages). **Requiere autorización expresa del usuario.**

## Estado
- 0.1.0 (F1 jugable): onboarding, casa vacía con avatar y diálogo guiado, tienda (solo catálogo, sin compra), preguntas con monedas/rachas/repetición espaciada, estadísticas básicas, ajustes (tema, exportar/importar, reiniciar). 18 tests unitarios + e2e (`tests/e2e/e2e.mjs`) en verde.
- Banco CE: **68 preguntas de muestra**, redactadas de memoria y **pendientes de revisión contra el BOE** (no afirmar que están verificadas). Objetivo ≥360.
- Siguiente: ampliar y revisar el banco (F1b); F2 tienda con compra, mascotas y crecimiento; F3 comodín 50 %, logros.
- Ganchos de prueba `window.__store`/`__quiz` solo en `localhost`.
