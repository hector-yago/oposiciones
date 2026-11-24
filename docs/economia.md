# Economía del juego (simulación)

Generada con `node tools/simulate-economy.mjs --md` usando las reglas reales de `js/economy.js`.
Solo cuenta aciertos, rachas (3 → +1, 10 → +2) y la entrada diaria (+1). **No** cuenta misiones (≈ +8 al día y ≈ +45 a la semana), el objetivo diario (+2), las monedas que traen las mascotas felices ni las cajas misteriosas: un jugador real llega antes.

| Precisión | Preguntas/día | Monedas/pregunta | Monedas/día | Días para el perro (50) | Días para comprarlo todo |
|---|---|---|---|---|---|
| 60 % | 10 | 0,69 | 7,9 | 7 | 181 |
| 60 % | 20 | 0,69 | 14,8 | 4 | 97 |
| 60 % | 40 | 0,69 | 28,6 | 2 | 50 |
| 75 % | 10 | 0,89 | 9,9 | 6 | 145 |
| 75 % | 20 | 0,89 | 18,7 | 3 | 77 |
| 75 % | 40 | 0,89 | 36,4 | 2 | 40 |
| 90 % | 10 | 1,12 | 12,2 | 5 | 117 |
| 90 % | 20 | 1,12 | 23,4 | 3 | 61 |
| 90 % | 40 | 1,12 | 45,8 | 2 | 32 |

| Categoría | Coste total (monedas) |
|---|---|
| Seres vivos (1 de cada) | 454 |
| Herramientas | 242 |
| Accesorios | 273 |
| Ropa | 132 |
| Jardín (todo) | 140 |
| Estudio (todo) | 185 |
| **Todo** | **1426** |

## Lectura
- Con 20 preguntas al día y un 75 % de aciertos se ganan unas 19 monedas al día: la primera mascota (cactus, 1) es inmediata, el perro (50) llega en 3 días y **todo el catálogo en unos 2,5 meses** (menos con misiones).
- Con ritmo bajo (10 preguntas, 60 % de aciertos) tarda unos 6 meses: sigue habiendo meta a largo plazo.
- Se deja el reparto de precios tal cual (barato = engancha; caro = aspiracional). Si en la práctica se completa demasiado rápido, subir los 5 artículos más caros (trofeo, bola de discoteca, panda, zorro, perro) o añadir contenido nuevo es más sano que encarecer lo básico.
