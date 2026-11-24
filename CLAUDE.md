# oposiciones

PWA personal para estudiar oposiciones de forma gamificada: respondes preguntas tipo test → ganas monedas → compras mascotas (que crecen con tus aciertos), herramientas y decoración para tu casa. Tema inicial: Constitución Española (CE); más temas después. Proyecto **nuevo**, contexto **personal**. Se instala en móvil (Android/iOS) desde GitHub Pages, sin tiendas, y se lanza en el PC desde My Tools. Plan completo: `docs/adr/0001-alcance-y-decisiones.md`.

## Stack y comandos
- JS plano modular (ES modules), **sin build ni dependencias**. Node 22 solo para tests, servidor local y e2e.
- `npm test` (unitarios, `node --test`) · `node tests/e2e/e2e.mjs [--shots=carpeta]` (Edge/Chrome headless por CDP) · `npm run icons` · `npm run version:sync`.
- Servidor local: `node serve.mjs [puerto]` (8097). My Tools lo arranca con `abrir-oposiciones.ps1` (`-Parar`, `-SoloComprobar`).

## Reglas de diseño
- Lógica de juego **pura** (`economy`, `scheduler`, `pets`, `achievements`, `stats`): sin DOM ni reloj; reciben «ahora» por parámetro.
- Persistencia: un único documento JSON (`js/store.js`) en IndexedDB. **Prohibido cambiar la forma de los datos sin migración + fixture + test** (`docs/datos-y-migraciones.md`).
- Preguntas: redactadas por nosotros a partir del texto oficial (BOE); **no copiar bancos de webs/academias** (copyright). Fuente en `docs/fuente-ce/`. Formato `{id, tema, titulo, articulo, enunciado, opciones[4], correcta, explicacion, dificultad}`; validadas por test (esquema, ids únicos, sin duplicados) y revisadas contra el BOE.
- Arte: SVG propio en código + animaciones CSS; sin imágenes externas.
- Castigos suaves (decisión del usuario, 2026-11-24): cada 3 fallos seguidos las mascotas se enfadan/ensucian y crecen a la mitad hasta que el personaje las calma o limpia; **nunca mueren**. Mascota feliz y limpia → cada 12 aciertos encuentra una moneda que se recoge tocándola.
- Entrada diaria: +1 moneda por día (el primer día no); al 7.º día seguido, caja misteriosa con un objeto exclusivo (`EXCLUSIVES` en `js/catalog.js`).
- Sin push, sin backend, sin telemetría. Datos solo en el dispositivo; export/import JSON + copias automáticas.
- Tema claro/oscuro con tokens CSS; interfaz en castellano; código en inglés.
- Usar siempre origen `localhost` (los datos de IndexedDB son por origen).

## Release (regla general del usuario; cada cambio)
1. Subir `version` en `package.json` y `npm run version:sync` (js/version.js y caché del `sw.js`).
2. Tests (+ e2e cuando exista) en verde.
3. Cerrar solo la instancia en marcha (`abrir-oposiciones.ps1 -Parar`); My Tools la lanza de nuevo.
4. Publicar: `git push` a `main` (repo `hector-yago/oposiciones`; Pages: `https://hector-yago.github.io/oposiciones/`). **Requiere autorización expresa del usuario.**

## Estado
- **0.2.0**: F1 + F2 + F3 completas (tienda con compra y nombre de mascota, crecimiento por etapas, herramientas con bonus, decoración, castigos y cuidados, entrada diaria y caja semanal, comodín 50 % cada 4 h, ~60 logros en 5 categorías, estadísticas por Título/artículo/semana). Esquema de datos 2.
- Banco CE: **512 preguntas** redactadas con texto propio a partir del **texto consolidado del BOE** (`docs/fuente-ce/ce-consolidada.xml`, reformas de 1992/2011/2024 incluidas; regenerar con `node tools/extract-ce.mjs`). Revisadas por agentes `reviewer` contra `ce.txt` (2 pasadas en los tramos dudosos) y validadas por test (esquema, artículo/título existentes, ids únicos). Revisión humana pendiente antes de estudiar con fiabilidad total. Fusión de borradores: `node tools/merge-bank.mjs`.
- Pendiente: prueba en móvil real (`docs/pruebas.md`); más temas (añadir `data/<tema>.json` y su entrada en `data/temas.json`).
- Ganchos de prueba `window.__store`/`__quiz`/`__daily` solo en `localhost`.
