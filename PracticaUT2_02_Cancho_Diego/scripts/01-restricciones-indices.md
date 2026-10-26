### scripts/01-restricciones-indices.cypher

```cypher
// 1. Restricciones de unicidad (Evita duplicados y crea un índice B-Tree automático)

CREATE CONSTRAINT animal_id IF NOT EXISTS FOR (a:Animal) REQUIRE a.id IS UNIQUE;

CREATE CONSTRAINT adoptante_id IF NOT EXISTS FOR (ad:Adoptante) REQUIRE ad.id IS UNIQUE;

CREATE CONSTRAINT protectora_id IF NOT EXISTS FOR (p:Protectora) REQUIRE p.id IS UNIQUE;

CREATE CONSTRAINT acogida_id IF NOT EXISTS FOR (ca:CasaAcogida) REQUIRE ca.id IS UNIQUE;

CREATE CONSTRAINT ciudad_id IF NOT EXISTS FOR (c:Ciudad) REQUIRE c.id IS UNIQUE;

CREATE CONSTRAINT especie_id IF NOT EXISTS FOR (e:Especie) REQUIRE e.id IS UNIQUE;

// 2. Índices secundarios (Para acelerar búsquedas de atributos comunes sin escanear el grafo)

CREATE INDEX animal_tamano IF NOT EXISTS FOR (a:Animal) ON (a.tamano);

CREATE INDEX adoptante_jardin IF NOT EXISTS FOR (ad:Adoptante) ON (ad.tiene_jardin);