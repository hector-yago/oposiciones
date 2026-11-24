# Cómo añadir un tema nuevo

Un tema es una ley (o un bloque de una ley) con su banco de preguntas. La app ya está preparada para varios temas: aparece un selector en *Preguntas* y todos los modos de estudio (examen, falladas, grupos, tarjetas, minijuegos, visor de artículos) usan el tema elegido.

## 1. Preparar el texto oficial
```
node tools/new-tema.mjs <BOE-id> <tema> "<Nombre>"
# ejemplo: node tools/new-tema.mjs BOE-A-2015-10565 ley39 "Ley 39/2015"
```
Descarga el texto **consolidado** (con todas las reformas), extrae los artículos y crea:
- `docs/fuente-<tema>/<tema>.txt` y `.json` (fuente de verdad; solo lectura),
- `data/<tema>-articulos.json` (lo que enseña la app),
- `docs/fuente-<tema>/borradores/INSTRUCCIONES.md` (instrucciones para redactar preguntas) y `retiradas.json`.

El BOE-id está en la URL de la ley en boe.es (`…id=BOE-A-2015-10565`). Hay que revisar a mano que los grupos que imprime son los que quieres (Títulos o Capítulos).

## 2. Redactar y revisar las preguntas
1. Redactar en lotes por tramos de artículos (puede hacerse con agentes `general-purpose` en paralelo, uno por tramo) con las `INSTRUCCIONES.md`; cada lote en `docs/fuente-<tema>/borradores/<tema>-A.json`, `-B.json`…
2. Fusionar y validar: `node tools/merge-bank.mjs <tema>` (comprueba que cada artículo y grupo existen en el texto oficial).
3. Revisión factual independiente (agente `reviewer`, por tramos de ~100 preguntas) **contra el `.txt` del tema**, no de memoria. Aplicar correcciones y volver a ejecutar el paso 2.
4. Las preguntas dudosas que se marquen desde la app (Ajustes → *Preguntas dudosas*) se revisan igual.

Reglas del banco: correcta en posición 0 (la app baraja), 4 opciones distintas, una sola correcta según el texto, explicación con el artículo, ids `<tema>-NNN` estables (nunca se reutilizan), `titulo` = grupo **único en toda la app** (p. ej. `Ley 39/2015 · Capítulo I`, para que no choque con «Título I» de la Constitución).

## 3. Darlo de alta en la app
Añadir a `data/temas.json`:
```json
{
  "id": "ley39",
  "nombre": "Ley 39/2015",
  "descripcion": "Procedimiento administrativo común.",
  "archivo": "data/ley39.json",
  "articulos": "data/ley39-articulos.json",
  "grupos": [{ "id": "Ley 39/2015 · Capítulo I", "short": "Capítulo I", "desc": "Disposiciones generales (arts. 1-3)" }]
}
```
y añadir los dos ficheros nuevos de `data/` a la lista `SHELL` de `sw.js` (para que funcione sin conexión).

## 4. Comprobar y publicar
`npm test` (valida esquema, ids, artículos, grupos únicos), `node tests/e2e/e2e.mjs`, subir versión (`package.json` + `npm run version:sync`) y seguir la regla de release de `CLAUDE.md`.

## Límites actuales
- Los logros «Constitución dominada» y «Mitad de la Constitución» son del tema `ce`; «Tema completo» sirve para cualquiera.
- Las misiones de «acierta N del grupo X» usan los grupos de todos los temas.
- Las estadísticas por grupo se muestran juntas (por eso los grupos deben tener etiquetas únicas).
