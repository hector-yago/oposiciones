# ADR 0003 — Tienda ampliada y modo día/noche

Estado: aceptada (2026-11-24) · Origen: petición del usuario.

## Decisiones
- **Más contenido**: seres vivos nuevos (margarita 2, hámster 8, tortuga 14, bonsái 25, conejo 30, loro 40), 7 herramientas (abono, comedero, cepillo, rueda, terrario, conejera, percha) y 7 accesorios (cojines, espejo, lámpara de pie, monstera, radio, pizarra, bola de discoteca). Los precios mantienen la progresión: lo barato engancha, lo caro es meta.
- **Casas de animales**: hámster, tortuga, conejo y loro viven en su herramienta si la tienen (rueda, terrario, conejera, percha); si no, van al suelo. Margarita y cactus comparten la repisa de la ventana. Las plantas se marchitan en lugar de ensuciar.
- **Día y noche**: de 06:00 a 18:00 es de día; el resto, de noche (cielo oscuro, luna, estrellas, la casa se oscurece). Se decide con la hora local del dispositivo y se puede forzar en Ajustes (Automática / Día / Noche).
- **Lámparas**: la lámpara colgante y la de pie dan luz de noche; se encienden y apagan tocándolas (un único interruptor, `flags.lampOff`). Sin lámpara, la casa queda a oscuras de noche (el personaje lo comenta).

## Consecuencias
- Sin cambio de esquema: `settings.sceneMode` se añade con valor por defecto (los datos 0.2.0 siguen válidos).
- La hora se lee del dispositivo; en localhost se puede probar con `?hora=22`.
