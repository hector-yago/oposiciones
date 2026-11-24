# ADR 0004 — Modos de estudio, jardín, ropa y extras (0.4.0)

Estado: aceptada (2026-11-24) · Origen: lista de ideas propuesta al usuario y aprobada («los otros 14 puedes hacerlos»).

## Hecho
- **Más seres vivos**: patito, pollito, erizo, cerdito, ovejita, zorro, panda. Viven en el **jardín** (segunda habitación que se compra, con sus herramientas: nido, estanque, corral, madriguera, bambú; y objetos: farola —luz de noche—, banco, huerto, columpio, fuente).
- **Ropa y armario**: 10 prendas en 4 sitios (sombrero, cara, cuello, camiseta) que se ven en el personaje.
- **Estudio**: modo examen (tiempo, sin pistas, nota con penalización de 1/3, recompensa por aprobar), repaso de falladas, estudio por Título, tarjetas y visor del texto oficial del artículo (también desde el feedback, el examen y las estadísticas), minijuegos (emparejar y verdadero/falso, 3 partidas con premio al día).
- **Misiones** diarias y semanales deterministas por fecha, **objetivo de estudio** (fecha de examen, preguntas al día, +2 monedas al cumplirlo).
- **Cría**: 2 adultos felices y limpios de la misma especie → cría gratis (1 por semana y especie; hasta el doble del máximo de compra), con 30 % de color raro (azul, dorado, arcoíris).
- **Temporadas**: Navidad, Halloween, verano y primavera cambian la ventana y añaden objetos; se pueden desactivar.
- **Accesibilidad**: texto grande y muy grande, menos movimiento (además de respetar el ajuste del sistema).
- **Compartir la casa** como imagen PNG (hoja Compartir del móvil o descarga) y **código de copia** (texto «OPO1:…») para pasar el progreso entre dispositivos sin servidor.
- Esquema de datos **3** con migración desde 0.2/0.3.

## No hecho / limitado (necesita decisión o servidor)
- **Notificaciones push reales**: requieren un servidor de push (VAPID) y que el usuario acepte permisos; sin backend no hay forma fiable en PWA iOS. Sustituto: aviso dentro de la app con las preguntas vencidas.
- **Sincronización automática** entre dispositivos: requiere backend o cuenta. Sustituto: código de copia manual.
- **Más habitaciones** (cocina, terraza…): solo se ha hecho el jardín.
- **Más temas**: depende de que el usuario decida cuáles.

## Consecuencias
- El texto de los artículos (`data/ce-articulos.json`, ~110 KB) se publica con la app y se guarda en caché para uso sin conexión.
- Cambiar la hora o la fecha del dispositivo permite adelantar bonus, comodín y misiones (aceptado: app personal sin backend).
