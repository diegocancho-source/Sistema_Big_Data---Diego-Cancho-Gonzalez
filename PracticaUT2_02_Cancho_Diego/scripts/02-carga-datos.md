### scripts/02-carga-datos.cypher

```cypher
// 3. Carga controlada y segura (Idempotente) utilizando MERGE
// Creación de Ciudades y Especies (Catálogos)

MERGE (c1:Ciudad {id: "MAD"}) SET c1.nombre = "Madrid"

MERGE (c2:Ciudad {id: "BCN"}) SET c2.nombre = "Barcelona"

MERGE (e1:Especie {id: "PER"}) SET e1.nombre = "Perro"

MERGE (e2:Especie {id: "GAT"}) SET e2.nombre = "Gato"

// Creación de Protectoras y Casas de Acogida

MERGE (p1:Protectora {id: "P1"}) SET p1.nombre = "Refugio Patas"

MERGE (p2:Protectora {id: "P2"}) SET p2.nombre = "Gatos Sin Hogar BCN"

MERGE (ca1:CasaAcogida {id: "CA1"}) SET ca1.alias = "Familia Pérez", ca1.capacidad_maxima = 2

MERGE (ca2:CasaAcogida {id: "CA2"}) SET ca2.alias = "Laura Voluntaria", ca2.capacidad_maxima = 1

// Creación de Animales

MERGE (a1:Animal {id: "A1"}) SET a1.nombre = "Toby", a1.tamano = "Grande", a1.necesita_jardin = true

MERGE (a2:Animal {id: "A2"}) SET a2.nombre = "Luna", a2.tamano = "Pequeño", a2.necesita_jardin = false

MERGE (a3:Animal {id: "A3"}) SET a3.nombre = "Simba", a3.tamano = "Mediano", a3.necesita_jardin = false

MERGE (a4:Animal {id: "A4"}) SET a4.nombre = "Rex", a4.tamano = "Grande", a4.necesita_jardin = true

MERGE (a5:Animal {id: "A5"}) SET a5.nombre = "Mia", a5.tamano = "Pequeño", a5.necesita_jardin = false

// Creación de Adoptantes

MERGE (ad1:Adoptante {id: "AD1"}) SET ad1.alias = "Usuario_A88", ad1.tiene_jardin = true

MERGE (ad2:Adoptante {id: "AD2"}) SET ad2.alias = "Usuario_B42", ad2.tiene_jardin = false

MERGE (ad3:Adoptante {id: "AD3"}) SET ad3.alias = "Usuario_C11", ad3.tiene_jardin = false

// Relaciones: Ubicaciones

MERGE (p1)-[:UBICADA_EN]->(c1)
MERGE (p2)-[:UBICADA_EN]->(c2)
MERGE (ca1)-[:SITUADA_EN]->(c1)
MERGE (ca2)-[:SITUADA_EN]->(c2)
MERGE (ad1)-[:RESIDE_EN]->(c1)
MERGE (ad2)-[:RESIDE_EN]->(c1)
MERGE (ad3)-[:RESIDE_EN]->(c2)

// Relaciones: Especies y Compatibilidad

MERGE (a1)-[:ES_DE_ESPECIE]->(e1)
MERGE (a2)-[:ES_DE_ESPECIE]->(e1)
MERGE (a3)-[:ES_DE_ESPECIE]->(e2)
MERGE (a4)-[:ES_DE_ESPECIE]->(e1)
MERGE (a5)-[:ES_DE_ESPECIE]->(e2)

MERGE (a1)-[:COMPATIBLE_CON]->(e2) //
Toby se lleva bien con gatos

MERGE (a2)-[:COMPATIBLE_CON]->(e1) // Luna se lleva bien con otros perros

MERGE (a5)-[:COMPATIBLE_CON]->(e2)

// Relaciones: Tutela y Alojamiento

MERGE (a1)-[:TUTELADO_POR]->(p1)
MERGE (a2)-[:TUTELADO_POR]->(p1)
MERGE (a3)-[:TUTELADO_POR]->(p2)
MERGE (a4)-[:TUTELADO_POR]->(p1)
MERGE (a5)-[:TUTELADO_POR]->(p2)

MERGE (a1)-[:ALOJADO_EN {desde: "2023-01-15"}]->(ca1)

MERGE (a3)-[:ALOJADO_EN {desde: "2023-05-10"}]->(ca2)

// Relaciones: Adopciones y Convivencia de adoptantes

MERGE (ad2)-[:CONVIVE_CON]->(e2) // AD2 ya tiene un gato

MERGE (ad1)-[:ADOPTA {fecha: "2023-10-01"}]->(a4) // Rex fue adoptado por AD1