### scripts/03-consultas-operaciones.cypher

```cypher
// 1. Operación básica: Actualizar de forma segura (MERGE + SET)
// Asignamos una nueva casa de acogida a Luna (A2) actualizando su estado.

MATCH (a:Animal {id: "A2"}), (ca:CasaAcogida {id: "CA1"})
MERGE (a)-[r:ALOJADO_EN]->(ca)
ON CREATE SET r.desde = date()
ON MATCH SET r.actualizado = date();

// 2. Consulta de 1 salto: Vecinos inmediatos
// ¿Qué animales están tutelados por "Refugio Patas" y cuál es su especie?

MATCH (a:Animal)-[:TUTELADO_POR]->(p:Protectora {nombre: "Refugio Patas"})
MATCH (a)-[:ES_DE_ESPECIE]->(e:Especie)
RETURN a.nombre AS Animal, a.tamano AS Tamano, e.nombre AS Especie;

// 3. Consulta de varios saltos: Filtrado y encadenamiento
// Buscar casas de acogida en la misma ciudad que los adoptantes que tienen jardín, 
// para posibles visitas de pre-adopción.

MATCH (ad:Adoptante {tiene_jardin: true})-[:RESIDE_EN]->(c:Ciudad)<-[:SITUADA_EN]-(ca:CasaAcogida)
RETURN ad.alias AS Adoptante, c.nombre AS Ciudad, ca.alias AS Casa_Acogida;

// 4. Recomendación por afinidad (MATCH PATTERNS)
// CASO REAL: El Adoptante AD2 vive en Madrid, no tiene jardín y ya convive con un Gato.
// Queremos recomendarle un Perro que esté en Madrid, que no necesite jardín y sea compatible con gatos.

MATCH (ad:Adoptante {id: "AD2"})-[:RESIDE_EN]->(c:Ciudad)
MATCH (ad)-[:CONVIVE_CON]->(especie_residente:Especie)
MATCH (a:Animal {necesita_jardin: false})-[:TUTELADO_POR|:ALOJADO_EN]->(ubicacion)-[:UBICADA_EN|:SITUADA_EN]->(c)
MATCH (a)-[:ES_DE_ESPECIE]->(:Especie {nombre: "Perro"})
MATCH (a)-[:COMPATIBLE_CON]->(especie_residente)
WHERE NOT (a)<-[:ADOPTA]-() // Que no esté adoptado ya
RETURN a.nombre AS Recomendacion_Ideal, a.tamano AS Tamano;

// 5. Camino más corto (shortestPath)
// Calcula el grado de separación entre el Adoptante "AD2" y el perro "Rex" (A4)

MATCH (inicio:Adoptante {id: "AD2"}), (fin:Animal {id: "A4"})
MATCH camino = shortestPath((inicio)-[*]-(fin))
RETURN camino;