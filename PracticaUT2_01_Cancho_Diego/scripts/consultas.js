// 1. INSERCIÓN
db.contenidos.insertOne({
  titulo: "Código Cero",
  sinopsis: "Un hacker descubre una conspiración global.",
  tipo: "PELICULA",
  año_estreno: 2025,
  generos: ["Acción", "Ciencia Ficción"],
  estado: "DISPONIBLE",
  promedio_valoracion: 0,
  total_valoraciones: 0,
  duracion_minutos: 110,
  temporadas: [],
  fecha_alta: new Date()
});

// 2. ACTUALIZACIÓN PARCIAL Y DESACTIVACIÓN LÓGICA
db.contenidos.updateOne(
  { _id: ObjectId("660000000000000000000203") },
  { $set: { estado: "RETIRADO" } }
);

// 3. CONSULTA CON FILTROS, ORDENACIÓN Y PAGINACIÓN ESTABLE
db.contenidos.find(
  { estado: "DISPONIBLE", generos: "Ciencia Ficción", promedio_valoracion: { $gte: 4.0 } },
  { titulo: 1, año_estreno: 1, promedio_valoracion: 1 }
)
.sort({ año_estreno: -1, _id: 1 })
.skip(0)
.limit(2);

// 4. CONSULTA CON $LOOKUP
db.valoraciones.aggregate([
  { $match: { _id: ObjectId("660000000000000000000401") } },
  {
    $lookup: {
      from: "usuarios",
      localField: "usuario_id",
      foreignField: "_id",
      as: "datos_usuario"
    }
  },
  {
    $lookup: {
      from: "contenidos",
      localField: "contenido_id",
      foreignField: "_id",
      as: "datos_contenido"
    }
  },
  { $unwind: "$datos_usuario" },
  { $unwind: "$datos_contenido" },
  {
    $project: {
      puntuacion: 1,
      comentario: 1,
      "datos_usuario.nombre": 1,
      "datos_contenido.titulo": 1
    }
  }
]);

// 5. AGREGACIÓN COMPLEJA DE 5 ETAPAS
db.contenidos.aggregate([
  { $match: { estado: "DISPONIBLE" } },
  { $unwind: "$generos" },
  {
    $group: {
      _id: "$generos",
      total_titulos: { $sum: 1 },
      promedio_calificacion: { $avg: "$promedio_valoracion" },
      duracion_promedio: { $avg: "$duracion_minutos" }
    }
  },
  {
    $lookup: {
      from: "generos",
      localField: "_id",
      foreignField: "nombre",
      as: "detalles_genero"
    }
  },
  {
    $facet: {
      resumen_generos: [
        {
          $project: {
            genero: "$_id",
            total_titulos: 1,
            calificacion_media: { $round: ["$promedio_calificacion", 2] },
            duracion_media_min: { $round: ["$duracion_promedio", 0] }
          }
        },
        { $sort: { calificacion_media: -1 } }
      ]
    }
  }
]);