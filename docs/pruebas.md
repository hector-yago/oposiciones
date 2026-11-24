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

