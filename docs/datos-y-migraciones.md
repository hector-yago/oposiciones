# Datos entre versiones

Mismo mecanismo que task-reminder. El progreso (monedas, mascotas, historial de aciertos) no se pierde al actualizar.

1. **Documento versionado**: `schemaVersion` (`CURRENT_SCHEMA` en `js/migrations.js`), guardado como un único documento en IndexedDB (`js/store.js`), escritura atómica.
2. **Migraciones**: un paso por versión (`N → N+1`), puro, idempotente y sin borrar datos del usuario. Un paso publicado **nunca se edita**.
3. **Copia previa**: antes de migrar, importar o restaurar se guarda un snapshot (últimas 7) y una copia automática diaria.
4. **Datos de una versión más nueva**: error visible y **no se toca nada**.
5. **Saneado**: al migrar/importar se descarta solo lo irrecuperable.
6. **Copias manuales**: Ajustes → Exportar/Importar JSON versionado.
7. **Almacenamiento**: `navigator.storage.persist()`; en iOS la PWA instalada no se purga por inactividad.

## Cómo cambiar el esquema
1. Subir `CURRENT_SCHEMA` y añadir `steps[N]`.
2. Guardar el fixture de la versión anterior en `tests/fixtures/vN.json`.
3. Test que lo migre sin perder nada.
4. Anotarlo aquí y subir la versión de la app.

Nota: el banco de preguntas (`data/*.json`) **no** forma parte del documento del usuario; el progreso se enlaza por `id` de pregunta, que por tanto es **estable e inmutable** (si una pregunta se corrige, conserva su id; si se retira, se marca `retirada: true`, no se borra).
