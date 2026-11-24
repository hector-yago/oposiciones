# Pruebas manuales

## Instalación en móvil (pendiente)
1. Abrir la URL de GitHub Pages en Safari (iPhone) / Chrome (Android).
2. iPhone: Compartir → «Añadir a pantalla de inicio». Android: menú → «Instalar aplicación».
3. Abrir desde el icono: debe verse a pantalla completa y funcionar sin conexión.
4. Responder preguntas, cerrar la app del todo y reabrirla: monedas y progreso intactos.
5. Tras una nueva versión, abrir con conexión: debe actualizarse (service worker red-primero).

## F1 (0.1.0) — qué probar a mano
1. Primer arranque: nombre + Chico/Chica → casa vacía; la pestaña Tienda parpadea.
2. Tienda: «¿Qué desea comprar?», 0 monedas, mensaje «Vaya, no tengo monedas…» y parpadea Preguntas.
3. Preguntas → Constitución: 3 aciertos seguidos = 4 monedas (1+1+1+1 extra); fallo → se marca la correcta y se corta la racha.
4. Una pregunta fallada no debe reaparecer en las ~8 siguientes; las acertadas salen cada vez menos.
5. Cerrar y reabrir: monedas y progreso intactos. Estadísticas: % por título y preguntas más falladas.
6. Ajustes: tema claro/oscuro, exportar e importar.


## 0.2.0 — qué probar a mano
1. Tienda: comprar un cactus (te pide nombre) y una regadera; el cactus aparece en la repisa de la ventana y crece con los aciertos.
2. Fallar 3 preguntas seguidas con mascotas: se enfadan y ensucian; tocar la caca la limpia y tocar la mascota la calma.
3. Con una mascota feliz, tras 12 aciertos aparece una moneda sobre ella: tocarla la cobra.
4. Comodín 50 %: deja 2 opciones y no vuelve hasta pasadas 4 h.
5. Entrada diaria: al día siguiente +1 moneda; al 7.º día seguido, caja misteriosa en Casa.
6. Logros y Estadísticas (semana, artículos con más fallos).
7. Actualización desde la 0.1.0 con datos reales: abrir y comprobar que monedas y progreso siguen ahí.
