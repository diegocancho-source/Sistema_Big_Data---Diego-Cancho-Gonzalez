# 5. Comparativa técnica, Seguridad y Copias (Actividad 5)

## 1. Comparativa Técnica frente a SQL
Para responder a la **Consulta 4 (Recomendación por afinidad)** en una base de datos relacional tradicional (PostgreSQL/MySQL), necesitaríamos enlazar las siguientes tablas:
`Adoptantes` JOIN `Ciudades` JOIN `Protectoras_Ubicacion` JOIN `Animales` JOIN `Animal_Especie` JOIN `Compatibilidades` JOIN `Convivencia_Actual`.

**Problema en SQL:** Son unos **6 o 7 JOINs**. A medida que la base de datos crezca (cientos de miles de registros), la base de datos relacional consumirá una cantidad enorme de RAM y CPU cruzando índices B-Tree, calculando productos cartesianos y filtrando en tiempo de ejecución. 
**Ventaja en Neo4j:** Utiliza **Index-Free Adjacency** (Adyacencia libre de índices). Una vez que Neo4j localiza al `Adoptante` y a la `Ciudad` inicial a través de un índice (paso de O(log n)), el resto de saltos son desplazamientos directos en memoria (O(1) por relación). El rendimiento depende del grafo local que se recorre, no del tamaño total de la base de datos.

## 2. Copias de Seguridad y Restauración
Para volcar los datos en un entorno local (Cypher-shell/Terminal):
1. **Detener la base de datos:** `neo4j-admin database stop neo4j`
2. **Generar Backup (Dump):** 
   `neo4j-admin database dump neo4j --to-path=/ruta/backups/neo4j_backup_2026.dump`
3. **Restaurar (Load):** 
   `neo4j-admin database load neo4j --from-path=/ruta/backups/neo4j_backup_2026.dump --overwrite-destination=true`
*(Si se usa Neo4j Aura, el snapshot se programa desde la consola web del Cloud y se exporta gráficamente).*

## 3. Seguridad, Permisos y RGPD
Para proteger datos (RGPD), se establecen roles mínimos con RBAC (Role-Based Access Control):
* **Rol `app_reader`:** Solo tiene permiso de lectura (`GRANT MATCH ON GRAPH neo4j TO app_reader`). Se le asigna a la API de la aplicación móvil de los adoptantes. No ven los nodos `:CasaAcogida` directamente.
* **Rol `shelter_manager`:** Permisos de lectura y escritura (`GRANT WRITE...`), pero limitados a modificar nodos `:Animal` y crear `:Adoptante`.

## 4. Cuándo NO usar Neo4j
Los grafos no sirven para todo. Sería un error utilizar Neo4j en estos dos escenarios:
1. **Sistemas Transaccionales Contables (Ledgers/ERP):** Si necesitamos procesar pagos, facturas de las protectoras y nóminas de veterinarios. Las BBDD relacionales (ACID estricto tabular) son ideales para esto.
2. **Almacenamiento de historiales clínicos completos:** Si queremos guardar el documento completo (PDF, largos textos) de la cartilla sanitaria o historial de operaciones de un perro, es mucho más eficiente usar una Base de Datos Documental como **MongoDB**.