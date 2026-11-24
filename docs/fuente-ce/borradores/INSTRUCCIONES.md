# Instrucciones para redactar preguntas de la Constitución Española

Fuente de verdad (única): `D:\proyectos\oposiciones\docs\fuente-ce\ce.txt` (texto oficial BOE-A-1978-31229, artículos 1-169).
Lee SOLO el tramo de artículos que te toque (usa Grep con `-n "^Artículo N$"` para localizar líneas y Read con offset/limit). No uses memoria ni otras webs: todo lo que afirmes debe poder comprobarse en ese texto.

## Qué escribir
Un fichero JSON (array) con preguntas tipo test originales, redactadas con tus propias palabras (no copies bancos de academias ni webs). Formato EXACTO de cada elemento:

{"id":"ce-XXX","tema":"ce","titulo":"Título II","articulo":"57.1","enunciado":"...","opciones":["correcta","falsa1","falsa2","falsa3"],"correcta":0,"explicacion":"Art. 57.1 CE: ...","dificultad":2}

Reglas:
- `id`: `ce-` + número de 3 cifras dentro de tu rango asignado (consecutivos).
- `titulo`: "Título Preliminar", "Título I", "Título II"… "Título X" (según el artículo: Prel 1-9, I 10-55, II 56-65, III 66-96, IV 97-107, V 108-116, VI 117-127, VII 128-136, VIII 137-158, IX 159-165, X 166-169).
- `articulo`: solo el número y, si procede, apartado: "15", "57.1" (formato `^\d+(\.\d+)?$`; no uses letras ni «a)»). El apartado debe ser donde realmente está el dato.
- `opciones`: exactamente 4, sin repetidas. **Pon SIEMPRE la correcta en la posición 0** y `correcta: 0` (la app baraja al mostrar).
- Una sola respuesta correcta, indiscutible según el texto. Las 3 falsas deben ser plausibles (cifras cercanas, órganos parecidos, cambios sutiles) pero FALSAS según el texto. Prohibido: «todas las anteriores», «ninguna», «a y b», opciones que sean verdaderas en otro apartado o artículo.
- Cuidado con preguntas «NO»: solo si las 3 restantes son verdaderas sin duda.
- Varía el tipo: dato numérico/plazo/mayoría, órgano competente, quién nombra/propone, composición, qué se garantiza, qué prohíbe, definición, «¿cuál NO...?», verdadero/falso reformulado, orden de pasos de un procedimiento. Mezcla dificultad 1 (literal básico), 2 (detalle) y 3 (matiz/procedimiento).
- No dupliques enunciados ni conceptos ya cubiertos (lista de existentes más abajo en tu prompt): aporta preguntas nuevas sobre otros apartados/aspectos del mismo artículo cuando haga falta.
- `explicacion`: una o dos frases que citen el artículo ("Art. N.M CE: ...") y justifiquen la respuesta.
- Español de España, claro, sin errores, sin datos personales. Enunciados autocontenidos (no dependen de otra pregunta).
- Cubre TODO tu tramo de forma equilibrada (que no queden artículos importantes sin ninguna pregunta); prioriza lo que suele caer en oposiciones.

## Entrega
Escribe el JSON con la herramienta Write en la ruta indicada (JSON válido: comillas dobles, sin comas finales, sin comentarios). Después valida tú mismo con: `node -e "const a=JSON.parse(require('fs').readFileSync(RUTA,'utf8'));console.log(a.length)"` y corrige si falla. Responde solo con: nº de preguntas, y cualquier artículo de tu tramo que hayas dejado sin cubrir y por qué. No modifiques ningún otro fichero.
