# Práctica 1: Diseña una base de datos con MongoDB

---

## 1. Definir el problema y los accesos

### 1.1 Escenario Elegido y Usuarios
* **Escenario:** Plataforma de Streaming Multimedia (**StreamFlix**).
* **Usuarios Finales (Espectadores):** Buscan contenido por género/tipo, ven episodios de series, guardan favoritos, otorgan valoraciones y reciben recomendaciones.
* **Gestores de Contenido:** Añaden películas, series y episodios, actualizan catálogos y clasifican por géneros.
* **Sistema de Analítica:** Analiza hábitos de consumo, valoraciones medias y tendencias por género para generar recomendaciones.

---

### 1.2 Preguntas de Negocio
* **P1 (Filtro y Paginación):** ¿Qué películas activas de un género específico tienen una valoración media superior a 4, ordenadas por año de estreno descendente y paginadas?
* **P2 (Gestión de Series/Episodios):** ¿Cuáles son todos los episodios de una temporada concreta de una serie, ordenados por número de episodio?
* **P3 (Recomendación por Afinidad):** ¿Qué títulos de un género preferido por un usuario aún no han sido valorados por él y tienen mejor puntuación global?
* **P4 (Búsqueda de Texto):** ¿Qué contenidos coinciden con un término de búsqueda en su título o sinopsis?
* **P5 (Agregación Compleja / Analítica):** ¿Cuál es el promedio de valoración, total de valoraciones y duración media de contenidos agrupados por género?
* **P6 (Detalle con Referencia):** ¿Cuáles son los detalles de una valoración específica, incluyendo la información completa del usuario que la realizó y del contenido valorado?

---

### 1.3 Matriz de Acceso y Operaciones

| Pregunta | Colección Principal | Filtros principales | Ordenación | Paginación / Límite | Frecuencia L/E |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P1** | `contenidos` | `tipo: "PELICULA"`, `generos`, `promedio_valoracion: { $gte: 4 }` | `año_estreno: -1` | `skip()`, `limit()` | Alta Lectura |
| **P2** | `contenidos` | `_id`, `temporadas.numero_temporada` | `episodios.numero_episodio: 1` | Proyección / `$slice` | Alta Lectura |
| **P3** | `contenidos` / `valoraciones` | `generos: { $in: [...] }`, `_id: { $nin: [...] }` | `promedio_valoracion: -1` | `limit(5)` | Media Lectura |
| **P4** | `contenidos` | `$text: { $search: "..." }` | Score de texto | `limit(10)` | Alta Lectura |
| **P5** | `contenidos` | `estado: "DISPONIBLE"` | `promedio_valoracion: -1` | `$facet` / `$limit` | Analítica (Baja) |
| **P6** | `valoraciones` | `_id: ObjectId(...)` | N/A | N/A | Lectura Media |

---

### 1.4 Requisitos de Seguridad, Privacidad y Crecimiento
* **Seguridad y Privacidad:** Cumplimiento de RGPD anonimizando o cifrando el email e historial de visualización. Autenticación con roles de mínimo privilegio.
* **Disponibilidad y Crecimiento:** Uso de *Replica Sets* para alta disponibilidad. Preparado para *sharding* horizontal utilizando `generos` o `_id` como clave de fragmentación cuando la colección alcance millones de documentos.

---

## 2. Diseñar las colecciones

### Diagrama Entidad-Relación / Modelo de Datos

![grafica](./evidencias/Captura%201.png)

---

### 2.1 Justificación de Decisiones de Modelado (Incrustación vs Referencias)

#### Incrustación (`temporadas` y `episodios` en `contenidos`):
* **Justificación:** Los episodios y temporadas de una serie pertenecen exclusivamente a esa serie y su cardinalidad es acotada (una serie rara vez supera las 20 temporadas o 500 episodios). Al incrustarse, toda la estructura de la serie se recupera en una sola lectura.

#### Referencia (`generos` y `valoraciones`):
* **Justificación de Géneros:** Los géneros son entidades maestras reutilizadas por miles de contenidos. Se almacenan como array de cadenas/referencias para mantener consistencia.
* **Justificación de Valoraciones:** La colección `valoraciones` se separa de `contenidos` y `usuarios` (referenciando ambos `_id`). La cardinalidad de valoraciones es $N$ a $M$ e ilimitada (un contenido puede recibir millones de valoraciones), lo que provocaría rebasar el límite de 16 MB por documento en MongoDB si se incrustaran todas en el contenido. En el documento del contenido solo se mantiene un resumen desnormalizado (`promedio_valoracion` y `total_valoraciones`).

---

### 2.3 Límites del Modelo
* **Límite de BSON (16 MB):** Se evita sobrepasar el límite desacoplando las valoraciones en su propia colección.
* **Crecimiento de Arrays:** El array de episodios en series muy largas (ej. telenovelas o animes de +1000 capítulos) puede crecer. Si supera límites aceptables, las temporadas se pueden mover a una colección secundaria.

---

## 3. Implementar validación e índices

### 3.1. Scripts de validación

#### Colección `generos`
```javascript
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
```
![grafica](./evidencias/Captura%202.png)

#### Colección `contenidos`
```javascript
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
```

#### Colección `usuarios`
```javascript
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
```

![grafica](./evidencias/Captura%203.png)

#### Colección `valoraciones`
```javascript
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
```

![grafica](./evidencias/Captura%204.png)

---

### 3.2. Carga de datos

#### Datos de la colección `generos`:
```javascript
db.generos.insertMany([
  { _id: ObjectId("660000000000000000000101"), nombre: "Ciencia Ficción", slug: "ciencia-ficcion", activo: true },
  { _id: ObjectId("660000000000000000000102"), nombre: "Acción", slug: "accion", activo: true },
  { _id: ObjectId("660000000000000000000103"), nombre: "Drama", slug: "drama", activo: true }
]);
```
![grafica](./evidencias/Captura%206.png)

#### Datos de la colección `usuarios`:
```javascript
db.usuarios.insertMany([
  { _id: ObjectId("660000000000000000000301"), nombre: "Laura Saelices", email: "laura@example.com", generos_favoritos: ["Ciencia Ficción"] },
  { _id: ObjectId("660000000000000000000302"), nombre: "Marcos Ruiz", email: "marcos@example.com", generos_favoritos: ["Acción", "Drama"] }
]);
```
![grafica](./evidencias/Captura%207.png)

#### Datos de la colección `contenidos`:
```javascript
db.contenidos.insertMany([
  {
    _id: ObjectId("660000000000000000000201"),
    titulo: "Cybernetica 2088",
    sinopsis: "Un mundo distópico dominado por la IA.",
    tipo: "PELICULA",
    año_estreno: 2024,
    generos: ["Ciencia Ficción"],
    estado: "DISPONIBLE",
    promedio_valoracion: 4.8,
    total_valoraciones: 10,
    duracion_minutos: 120,
    temporadas: [],
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
```
![grafica](./evidencias/Captura%208.png)

#### Datos de la colección `valoraciones`:
```javascript
db.valoraciones.insertMany([
  { _id: ObjectId("660000000000000000000401"), contenido_id: ObjectId("660000000000000000000201"), usuario_id: ObjectId("660000000000000000000301"), puntuacion: 5, comentario: "Sublime", fecha: new Date() },
  { _id: ObjectId("660000000000000000000402"), contenido_id: ObjectId("660000000000000000000202"), usuario_id: ObjectId("660000000000000000000302"), puntuacion: 4, comentario: "Muy buena", fecha: new Date() }
]);
```
![grafica](./evidencias/Captura%209.png)

---

### 3.3 Creación e Justificación de Índices

#### Índice Compuesto (Filtra por estado y género, ordena por año de estreno):
```javascript
db.contenidos.createIndex(
  { estado: 1, generos: 1, año_estreno: -1 },
  { name: "idx_estado_genero_año" }
);
```
![grafica](./evidencias/Captura%2010.png)

#### Índice de Texto (Permite buscar por términos clave en título y sinopsis):
```javascript
db.contenidos.createIndex(
  { titulo: "text", sinopsis: "text" },
  { default_language: "spanish", name: "idx_texto_contenido" }
);
```
![grafica](./evidencias/Captura%2011.png)

#### Índice Único (Evita que un mismo usuario valore más de una vez el mismo contenido):
```javascript
db.valoraciones.createIndex(
  { contenido_id: 1, usuario_id: 1 },
  { unique: true, name: "idx_contenido_usuario_unico" }
);
```
![grafica](./evidencias/Captura%2012.png)

---

## 4. Consultas y Agregación

### Inserción
```javascript
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
```
![grafica](./evidencias/Captura%2013.png)

---

### Actualización Parcial y Desactivación Lógica
```javascript
db.contenidos.updateOne(
  { _id: ObjectId("660000000000000000000203") },
  { $set: { estado: "RETIRADO" } }
);
```
![grafica](./evidencias/Captura%2014.png)

---

### Consulta con Filtros, Ordenación y Paginación Estable
```javascript
db.contenidos.find(
  { estado: "DISPONIBLE", generos: "Ciencia Ficción", promedio_valoracion: { $gte: 4.0 } },
  { titulo: 1, año_estreno: 1, promedio_valoracion: 1 }
)
.sort({ año_estreno: -1, _id: 1 })
.skip(0)
.limit(2);
```
![grafica](./evidencias/Captura%2015.png)

---

### Consulta con `$lookup`
```javascript
db.valoraciones.aggregate([
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
```
![grafica](./evidencias/Captura%2016.png)

---

### Agregación Compleja (5 Etapas)
```javascript
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
```
![grafica](./evidencias/Captura%2017.png)
![grafica](./evidencias/Captura%2018.png)

---

## 5. Copias de seguridad, seguridad y límites

### 5.1 Procedimiento de Copia de Seguridad y Restauración

#### Opción A: Mediante Herramientas de Línea de Comandos (`mongodump` y `mongorestore`)

Para realizar la copia de seguridad y restauración en un clúster de MongoDB Atlas o en una instancia propia local:

##### 1. Copia de Seguridad (`mongodump`)
```bash
mongodump --uri="mongodb+srv://<usuario>:<password>@cluster0.1mpth7v.mongodb.net/Tema2_Practica1" \
          --out=./backups/backup_$(date +%Y%m%d_%H%M%S) \
          --gzip
```

* **Parámetros utilizados:**
  * `--uri`: Cadena de conexión de la base de datos en MongoDB Atlas.
  * `--out`: Directorio de salida donde se guardará el respaldo.
  * `--gzip`: Comprime las colecciones BSON para reducir el espacio en disco.

##### 2. Restauración (`mongorestore`)
```bash
mongorestore --uri="mongodb+srv://<usuario>:<password>@cluster0.1mpth7v.mongodb.net/Tema2_Practica1" \
             --dir=./backups/backup_20261005_120000/Tema2_Practica1 \
             --drop \
             --gzip
```

* **Parámetros utilizados:**
  * `--drop`: Elimina las colecciones existentes antes de restaurarlas para evitar duplicados o conflictos.
  * `--gzip`: Descomprime los archivos `.bson.gz`.

---

#### Opción B: Copias de Seguridad Automatizadas en MongoDB Atlas

En entornos de producción, se aprovecha el servicio nativo **Continuous Cloud Backups** de MongoDB Atlas:

1. **Snapshots Automáticos:** Configuración de copias de seguridad continuas cada 6 horas con una retención programada de 30 días.
2. **Point-in-Time Recovery (PITR):** Permite restaurar el clúster a un segundo exacto en caso de corrupción de datos o errores catastróficos.
3. **Proceso de Restauración vía Interfaz/API:**
   * Navegar a **Database** -> **Cluster** -> **Backup**.
   * Seleccionar el punto de restauración o Snapshot deseado.
   * Elegir entre restaurar en un nuevo clúster de prueba o sobreescribir el clúster actual.

---

### 5.2 Usuarios, Roles y Permisos Mínimos (Principio de Menor Privilegio)

Para garantizar la seguridad de la base de datos, se aplican políticas de acceso restringido separando los entornos de aplicación y administración.

#### 1. Rol para la Aplicación (Servicio Web/API - `app_user`)
Permite las operaciones CRUD necesarias para el funcionamiento del servicio sin acceso a comandos administrativos o modificación de esquemas.

```javascript
use admin;

db.createUser({
  user: "app_streamflix",
  pwd: "PasswordSegura123!",
  roles: [
    { role: "readWrite", db: "Tema2_Practica1" }
  ]
});
```

* **Permisos Granulares Adicionales (Custom Role):** Si se desea restringir aún más, se puede crear un rol personalizado que impida eliminar documentos completos (`remove`) o modificar colecciones críticas como `generos`.

#### 2. Rol para Administración (`admin_user`)
Utilizado exclusivamente por Administradores de Bases de Datos (DBA) para mantenimiento, creación de índices y auditorías.

```javascript
use admin;

db.createUser({
  user: "dba_admin",
  pwd: "AdminPasswordUltraSegura456!",
  roles: [
    { role: "dbAdmin", db: "Tema2_Practica1" },
    { role: "readWrite", db: "Tema2_Practica1" },
    { role: "userAdmin", db: "Tema2_Practica1" }
  ]
});
```

---

### 5.3 Protección de Datos, Anonimización y Privacidad (RGPD)

#### 1. Datos a Cifrar
* **Cifrado en Tránsito (TLS/SSL):** Todas las conexiones entre clientes, servidores de aplicaciones y los nodos del clúster deben obligatoriamente exigir TLS 1.3.
* **Cifrado en Reposo (At Rest):** Uso de cifrado AES-256 en volumen/disco (habilitado por defecto en MongoDB Atlas).
* **Field Level Encryption (FLE / CSFLE):** Cifrado a nivel de campo cliente para el campo `email` en la colección `usuarios`.

#### 2. Anonimización y Exclusión para Entornos de Desarrollo/Pruebas
Los entornos de prueba **nunca** deben contener datos reales de usuarios en cumplimiento del RGPD:

* **Campos Excluidos / Anonimizados:**
  * `email`: Reemplazar mediante técnicas de enmascaramiento (`usuario_XXXX@test.com`) o hashes truncados.
  * `nombre`: Reemplazar con nombres ficticios (faker data).
  * `comentario` en `valoraciones`: Limpiar comentarios que puedan contener datos de carácter personal vertidos por los usuarios.

---

### 5.4 Situaciones donde MongoDB NO es la Mejor Opción

#### 1. Transacciones Financieras Complejas y Contabilidad Multi-Entidad
* **Motivo:** Aunque MongoDB soporta transacciones ACID multidocumento desde la versión 4.0, las bases de datos relacionales tradicionales (RDBMS como PostgreSQL o Oracle) ofrecen garantías ACID nativas más eficientes con esquemas relacionales estrictos y normalizados, ideales para libros contables, balances y transferencias financieras con cero tolerancia a inconsistencias eventuales.

#### 2. Motores de Búsqueda de Texto Complejo y Relevancia Avanzada
* **Motivo:** Pese a contar con índices de tipo `$text` y *Atlas Search*, para aplicaciones con requisitos complejos de procesamiento de lenguaje natural (NLP), facetado avanzado, análisis morfológico detallado, sinónimos dinámicos y búsqueda difusa (*fuzzy search*) masiva, es preferible utilizar un motor especializado como **Elasticsearch** o **Apache Solr** complementando a MongoDB.

---

### 5.5 Política de Conservación, Archivo y Eliminación de Datos

| Tipo de Dato | Criterio de Retención | Acción Habilitada | Justificación / Mecanismo |
| :--- | :--- | :--- | :--- |
| **Histórico de Visualizaciones / Logs de Sesión** | Conservar durante 12 meses | **Archivado / TTL** | Se utiliza un índice TTL (*Time-To-Live*) en MongoDB para purgar automáticamente eventos de analítica pasados los 365 días. |
| **Valoraciones y Reseñas Antiguas** | Conservar indefinidamente | **Conservar Denormalizado** | Se mantienen el `promedio_valoracion` y `total_valoraciones` agregados en el documento del contenido. Las valoraciones individuales de usuarios dados de baja se disocian/anonimizan (`usuario_id: null`). |
| **Cuentas de Usuario Inactivas / Dadas de baja** | Eliminar a los 30 días del cierre | **Eliminación Definitiva** | Eliminación de documentos en la colección `usuarios` bajo el principio de "Derecho al Olvido" del RGPD. |
| **Contenidos Retirados (`estado: "RETIRADO"`)** | Archivar a los 2 años | **Mover a Cold Storage** | Documentos inactivados que se exportan a S3/Atlas Data Lake comprimidos en Parquet/JSON para liberar memoria RAM e índices activos. |