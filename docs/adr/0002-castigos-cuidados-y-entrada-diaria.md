# ADR 0002 — Castigos, cuidados, entrada diaria y logros ampliados

Estado: aceptada (2026-11-24) · Origen: petición del usuario durante la implementación (sustituye la regla «sin castigos» del ADR 0001).

## Decisiones
- **Castigo**: cada 3 fallos seguidos (3, 6, 9…) todas las mascotas se enfadan (el cactus se pone mustio) y las que pueden ensucian (gato, perro, canario, pez) dejan una caca/suciedad (máx. 3). Una mascota enfadada o sucia crece a la mitad (×0,5) y no acumula alegría. **No mueren ni se pierde nada**.
- **Cuidados**: el personaje interactúa tocando — calmar a la mascota enfadada, limpiar cada caca.
- **Premio por felicidad**: mascota feliz y limpia → cada 12 aciertos encuentra una moneda (1; 2 si es adulta) que aparece en la escena y se recoge tocándola (en el cactus «le crece»). Un corazón indica que va por la mitad.
- **Entrada diaria**: +1 moneda cada día que se abre la app (el primer día de uso no, para no romper el arranque guiado «no tengo monedas»); saltarse un día reinicia la racha. Al 7.º día seguido, caja misteriosa con un objeto **exclusivo** (guirnalda, bandera, mapa, globos, La Constitución); si ya los tiene todos, 5 monedas.
- **Logros**: ~60 en 5 grupos — Preguntas (respondidas, acertadas, dominadas, Título/tema/Constitución dominados), Constancia, Mascotas, Cuidados y Casa. «Dominada» = caja 5 de la repetición espaciada.

## Consecuencias
- Esquema de datos 2 (migración 1→2 con valores por defecto; v1 de la versión 0.1.0 publicada se migra sin pérdida).
- Los reloj/fechas se leen del dispositivo: cambiar la hora del móvil permite adelantar el bonus diario o el comodín (aceptado: app personal sin backend).
