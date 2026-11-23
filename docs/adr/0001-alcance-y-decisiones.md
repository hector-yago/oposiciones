# ADR 0001 — Alcance y decisiones de la v1

Estado: aceptada (2026-11-24) · Origen: petición del usuario y plan aprobado.

## Contexto
Estudiar con tests infinitos aburre. Se quiere una PWA (Android/iOS, sin tiendas) con el estilo de task-reminder que convierta el estudio en un juego. Tema inicial: Constitución Española; ampliable.

## Decisiones
- **Distribución**: PWA en GitHub Pages (`hector-yago/oposiciones`) + lanzador en My Tools (puerto 8097). Sin push, sin backend.
- **Preguntas**: redactadas desde el texto del BOE (objetivo ~500, mínimo 360), con artículo y explicación; importables por JSON. No se copian bancos de terceros.
- **Arte**: SVG propio en código con animaciones CSS.
- **Datos**: documento JSON versionado en IndexedDB, migraciones, export/import y copias (patrón de task-reminder).
- **Fases**: F0 andamiaje · F1 núcleo · F2 tienda y mascotas · F3 comodín, logros, estadísticas.

## Reglas de juego (supuestos con default)
- Monedas: +1 por acierto; racha de 3 → +1; racha de 10 → +2 y la racha vuelve a 0; un fallo corta la racha.
- Fallo: se marca la correcta y se explica con el artículo.
- Comodín 50 %: 1 uso cada 4 h (descarta 2 incorrectas).
- Repetición espaciada (Leitner, cajas con intervalos 1·3·7·15·30 días): nuevas primero; acertadas cada vez menos; falladas vuelven «de vez en cuando» (mínimo ~8 preguntas después), sin martilleo.
- Mascotas: cactus 1, pez 5, canario 10, gato 20, perro 50 monedas; compra repetible, nombre propio; 3 etapas de crecimiento por XP de aciertos; la herramienta adecuada acelera ×1,5; sin castigos.
- Herramientas y accesorios con precios graduados (~25 objetos decorativos) para sostener el aliciente.
- Menú: Mi casa · Tienda · Preguntas · Logros · Estadísticas (+ Ajustes).

## Consecuencias
- Sin sincronización entre dispositivos en v1 (export/import manual).
- Persistencia en iOS PWA instalada: prueba manual pendiente.
- Ampliar temas = añadir `data/<tema>.json` y su entrada en `data/temas.json`.
