// 1. Colección Generos
db.createCollection("generos", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nombre", "slug", "activo"],
      properties: {
        nombre: { bsonType: "string" },
        slug: { bsonType: "string" },
        activo: { bsonType: "bool" }
      }
    }
  }
});

// 2. Colección Contenidos
db.createCollection("contenidos", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["titulo", "tipo", "año_estreno", "generos", "estado"],
      properties: {
        titulo: { bsonType: "string" },
        sinopsis: { bsonType: "string" },
        tipo: { 
          enum: ["PELICULA", "SERIE"],
          description: "El tipo debe ser PELICULA o SERIE"
        },
        año_estreno: { 
          bsonType: "int", 
          minimum: 1900, 
          maximum: 2100 
        },
        generos: {
          bsonType: "array",
          minItems: 1,
          items: { bsonType: "string" }
        },
        estado: { 
          enum: ["DISPONIBLE", "RETIRADO", "PROXIMAMENTE"] 
        },
        promedio_valoracion: { 
          bsonType: ["double", "int"], 
          minimum: 0, 
          maximum: 5 
        },
        temporadas: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["numero_temporada", "episodios"],
            properties: {
              numero_temporada: { bsonType: "int", minimum: 1 },
              episodios: {
                bsonType: "array",
                items: {
                  bsonType: "object",
                  required: ["numero_episodio", "titulo", "duracion_minutos"],
                  properties: {
                    numero_episodio: { bsonType: "int", minimum: 1 },
                    titulo: { bsonType: "string" },
                    duracion_minutos: { bsonType: "int", minimum: 1 }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
});

// 3. Colección Usuarios
db.createCollection("usuarios", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nombre", "email"],
      properties: {
        nombre: { bsonType: "string" },
        email: { 
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
        }
      }
    }
  }
});

// 4. Colección Valoraciones
db.createCollection("valoraciones", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["contenido_id", "usuario_id", "puntuacion"],
      properties: {
        contenido_id: { bsonType: "objectId" },
        usuario_id: { bsonType: "objectId" },
        puntuacion: { 
          bsonType: "int", 
          minimum: 1, 
          maximum: 5,
          description: "La puntuación debe ser un entero de 1 a 5"
        }
      }
    }
  }
});