db.generos.insertMany([
  { _id: ObjectId("660000000000000000000101"), nombre: "Ciencia Ficción", slug: "ciencia-ficcion", activo: true },
  { _id: ObjectId("660000000000000000000102"), nombre: "Acción", slug: "accion", activo: true },
  { _id: ObjectId("660000000000000000000103"), nombre: "Drama", slug: "drama", activo: true }
]);

db.usuarios.insertMany([
  { _id: ObjectId("660000000000000000000301"), nombre: "Laura Saelices", email: "laura@example.com", generos_favoritos: ["Ciencia Ficción"], fecha_registro: new Date("2024-01-10") },
  { _id: ObjectId("660000000000000000000302"), nombre: "Marcos Ruiz", email: "marcos@example.com", generos_favoritos: ["Acción", "Drama"], fecha_registro: new Date("2024-02-15") }
]);

db.contenidos.insertMany([
  {
    _id: ObjectId("660000000000000000000201"),
    titulo: "Cybernetica 2088",
    sinopsis: "Un detective investiga crímenes cibernéticos en un futuro distópico.",
    tipo: "SERIE",
    año_estreno: 2024,
    generos: ["Ciencia Ficción", "Acción"],
    estado: "DISPONIBLE",
    promedio_valoracion: 4.8,
    total_valoraciones: 10,
    duracion_minutos: 120,
    temporadas: [
      {
        numero_temporada: 1,
        episodios: [
          { numero_episodio: 1, titulo: "Conexión Inicial", duracion_minutos: 45 },
          { numero_episodio: 2, titulo: "Cortafuegos", duracion_minutos: 50 }
        ]
      }
    ],
    fecha_alta: new Date("2024-01-15")
  },
  {
    _id: ObjectId("660000000000000000000202"),
    titulo: "Horizonte Estelar",
    sinopsis: "Viaje épico hacia los confines de la galaxia.",
    tipo: "PELICULA",
    año_estreno: 2023,
    generos: ["Ciencia Ficción"],
    estado: "DISPONIBLE",
    promedio_valoracion: 4.2,
    total_valoraciones: 5,
    duracion_minutos: 140,
    temporadas: [],
    fecha_alta: new Date("2023-11-20")
  },
  {
    _id: ObjectId("660000000000000000000203"),
    titulo: "Sombras del Pasado",
    sinopsis: "Un drama sobre secretos familiares no resueltos.",
    tipo: "PELICULA",
    año_estreno: 2022,
    generos: ["Drama"],
    estado: "RETIRADO",
    promedio_valoracion: 3.1,
    total_valoraciones: 2,
    duracion_minutos: 105,
    temporadas: [],
    fecha_alta: new Date("2022-05-10")
  }
]);

db.valoraciones.insertMany([
  { _id: ObjectId("660000000000000000000401"), contenido_id: ObjectId("660000000000000000000201"), usuario_id: ObjectId("660000000000000000000301"), puntuacion: 5, comentario: "Sublime", fecha: new Date() },
  { _id: ObjectId("660000000000000000000402"), contenido_id: ObjectId("660000000000000000000202"), usuario_id: ObjectId("660000000000000000000302"), puntuacion: 4, comentario: "Buena película", fecha: new Date() }
]);