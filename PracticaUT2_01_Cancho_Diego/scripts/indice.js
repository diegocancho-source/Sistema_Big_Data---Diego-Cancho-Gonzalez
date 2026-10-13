// Índice 1: Compuesto ESR (Equality, Sort, Range) - Pregunta P1
// Filtra por estado y género, ordena por año de estreno
db.contenidos.createIndex(
  { estado: 1, generos: 1, año_estreno: -1 },
  { name: "idx_estado_genero_año" }
);

// Índice 2: Búsqueda de Texto Completo - Pregunta P4
// Permite buscar por términos clave en título y sinopsis
db.contenidos.createIndex(
  { titulo: "text", sinopsis: "text" },
  { default_language: "spanish", name: "idx_texto_contenido" }
);

// Índice 3: Único para evitar valoraciones duplicadas
// Un usuario solo puede valorar una vez el mismo contenido
db.valoraciones.createIndex(
  { contenido_id: 1, usuario_id: 1 },
  { unique: true, name: "idx_contenido_usuario_unico" }
);