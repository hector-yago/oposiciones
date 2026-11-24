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

## 0.3.0 — qué probar a mano
1. A partir de las 18:00 (o forzando «Noche» en Ajustes): cielo oscuro con luna y estrellas en la ventana y casa a oscuras.
2. Comprar una lámpara: de noche ilumina la casa; tocarla la apaga y la enciende.
3. Comprar una mascota nueva (margarita, hámster, tortuga, bonsái, conejo, loro) y su herramienta: viven en su casa dentro de la escena.
4. Fallar 3 seguidas con una margarita: se marchita (pierde pétalos) y se cuida tocándola.

## 0.4.0 — qué probar a mano
1. Tienda → Jardín: comprar el jardín; aparece «Jardín» en Casa; comprar un patito (+ estanque) y comprobar que vive allí.
2. Ropa: comprar una prenda, abrir Armario desde Casa y ponérsela; se ve en el personaje.
3. Preguntas → Modo examen (10 preguntas): sin explicación inmediata, temporizador, nota al final y repaso de errores.
4. «Repasar falladas», «Estudiar un Título», «Tarjetas de artículos» y el botón «Ver artículo» tras responder.
5. Minijuegos: emparejar y verdadero/falso; premio con tope de 3 partidas al día.
6. Ajustes: fecha de examen y objetivo diario; en Casa aparece la cuenta atrás y el progreso de hoy. Misiones: cobrar una terminada.
7. Cría: con 2 adultos felices de una especie aparece el botón «Criar».
8. Compartir mi casa (iPhone: hoja de compartir; PC: descarga PNG). Copiar código en un dispositivo y Pegar código en otro.
9. Texto grande y «Menos movimiento» en Ajustes; temporadas (Navidad del 15/12 al 6/1, etc.).

## 0.5.0 — qué probar a mano
1. Campana de la cabecera: número de avisos y lista; cada aviso lleva a su pantalla.
2. Ajustes → Copia de seguridad: texto con los días desde la última copia; «Copias automáticas» → restaurar (pide confirmación).
3. Tras 14 días sin exportar (o simulando con la fecha del móvil) aparece el aviso de copia.
4. Al responder, «☆ Dudosa» marca la pregunta; Ajustes → «Copiar informe».
5. Tienda → Estudio: comprar el estudio, muebles, flexo y animales; de noche el flexo ilumina y se apaga tocándolo.
6. Estadísticas: gráfico de exámenes, precisión semanal y dominio por Título.
7. Ajustes → «Sonidos»: suenan acierto/fallo, moneda, crecimiento, cajas y logros (en iPhone no suenan con el interruptor de silencio activado).
8. Icono nuevo (casa con moneda) al instalar la app.
