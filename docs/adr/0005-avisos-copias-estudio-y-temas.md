# ADR 0005 — Avisos, copias, preguntas dudosas, Estudio y temas (0.5.0)

Estado: aceptada (2026-11-24) · Origen: lista de pendientes aprobada por el usuario («haz todas»), con la restricción de **no montar backend ni servidor de notificaciones**.

## Decisiones
- **Avisos dentro de la app**: campana con número que reúne cuidados, monedas de mascotas, caja misteriosa, misiones por cobrar, objetivo de hoy, cuenta atrás del examen, preguntas por repasar, comodín y copia de seguridad (`js/notifications.js`). Se calculan al abrir la app; no hay notificaciones del sistema.
- **Copias**: sin sincronización el progreso solo vive en el dispositivo, así que se avisa a los 14 días sin exportar (solo si hay algo que perder) y se pueden restaurar las copias automáticas con confirmación en dos pasos (siempre se guarda antes otra copia de lo actual).
- **Preguntas dudosas**: se marcan al estudiar y se exporta un informe de texto para revisarlas contra el texto oficial (única vía realista de revisión humana sin servidor).
- **Sonidos**: efectos con Web Audio (sin ficheros), activados por defecto con volumen bajo y desactivables.
- **Estudio**: tercera habitación (50 monedas) con muebles, ordenador, flexo (luz de noche) y dos animales (ratón de biblioteca y búho).
- **Varios temas**: `data/temas.json` con `grupos`; extractor genérico (`tools/lib/law.mjs`) y `tools/new-tema.mjs`; el selector de tema aparece cuando hay más de uno.
- **Economía**: se simula con las reglas reales (`tools/simulate-economy.mjs`, `docs/economia.md`): ~2,5 meses para comprarlo todo a 20 preguntas/día; no se cambian precios.

## Consecuencias
- Esquema de datos 4 (migración con valores por defecto desde 0.4.0).
- Seguimos sin backend: sin push, sin sincronización automática y sin cuentas.

## Revisión previa a la publicación
Revisión independiente de seguridad y de corrección (agentes `security-reviewer` y `reviewer`) antes de cerrar la versión. Corregido y con test de regresión (`tests/fixes.test.mjs`):
- **Importación**: objetos con ids inventados («constructor», «__proto__»…) dejaban la app en blanco de forma persistente → el saneado los descarta, el catálogo no tiene prototipo y `render()` muestra una pantalla de recuperación; topes de tamaño y claves `__proto__` en los mapas; límite de tamaño de ficheros y códigos.
- **CSP** en `index.html` (sin scripts en línea; el tema se aplica desde `js/theme-boot.js`) y service worker que solo recurre a `index.html` en navegaciones.
- **Corrección**: frases que faltaban para ratón y búho (rompían la pantalla Casa de forma intermitente), doble cobro por doble toque (examen, verdadero/falso, compra de mascota), un guardado fallido ya no bloquea los siguientes, el reloj atrasado no regala el bonus diario, relojes adelantados no bloquean comodín/cría, un examen en blanco no cuenta, las misiones caducadas no cuentan respuestas, tras importar/restaurar se renuevan misiones y bonus, fechas reales y objetivo decimal, singular/plural en avisos, accesibilidad de diálogos (rol, Escape, foco).
- No corregido (sin riesgo hoy): con varios temas, las estadísticas por grupo se mezclan si dos temas repiten etiqueta (por eso hay un test que exige grupos únicos).
