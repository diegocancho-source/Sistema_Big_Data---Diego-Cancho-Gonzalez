# Práctica 02: Red de Adopción de Mascotas con Neo4j

**Autor:** Diego Cancho González
**Escenario Elegido:** 4. Red de adopción de mascotas.

## 1. Definición del Problema y Contexto (Actividad 1)

El abandono animal y la saturación de las protectoras es un desafío crítico. Encontrar el hogar ideal para un animal rescatado no es una simple transacción; requiere cruzar múltiples variables complejas: el comportamiento del animal, sus necesidades de espacio, su historial clínico y su compatibilidad con otros animales, frente a las condiciones de vida, ubicación y núcleo familiar del posible adoptante. 

En bases de datos relacionales tradicionales, este nivel de cruce de datos requiere consultas pesadas con múltiples `JOINs`, penalizando el rendimiento. Mediante el uso de **Neo4j y bases de datos de grafos**, este proyecto modela estas interacciones como una red de nodos interconectados. Esto permite recorrer millones de conexiones en milisegundos, habilitando un motor de recomendación en tiempo real que asegura la asignación más compatible, reduciendo así la tasa de devoluciones y mejorando el bienestar animal.

### 1.1. Actores Principales del Sistema

El ecosistema de esta red está compuesto por los siguientes actores y entidades, cada uno con un rol específico dentro del grafo:

1. **Animal Rescatado:** Es el nodo central del modelo. Posee características físicas (tamaño, especie, edad) y de comportamiento (necesidad de espacio exterior, sociabilidad, reactividad). 
2. **Protectora:** Entidad jurídica y física que realiza el rescate, asume la tutela legal del animal y gestiona los recursos iniciales.
3. **Casa de Acogida:** Voluntarios que ofrecen sus hogares temporalmente para liberar espacio en las protectoras, proporcionando un entorno seguro para la recuperación o socialización del animal.
4. **Adoptante:** Usuario final registrado en la plataforma que busca integrar un animal en su familia. Su perfil está definido por sus recursos espaciales (ciudad, tipo de vivienda, disponibilidad de jardín) y su entorno actual (si convive o no con otros animales).
5. **Motor de Recomendación:** Representa la lógica de negocio apoyada en Cypher. Es el actor no humano que evalúa constantemente los patrones del grafo para sugerir emparejamientos de alta idoneidad.

### 1.2. Preguntas de Negocio (Casos de Uso)

El diseño de la base de datos está orientado a responder de manera inmediata a las siguientes preguntas clave de negocio:

1. **¿Qué animales de tamaño grande están actualmente en protectoras o casas de acogida en una ciudad específica?**
   * *Objetivo:* Optimizar la logística de transporte y liberar rápidamente cheniles (jaulas) grandes en zonas saturadas.
2. **¿Qué adoptantes tienen jardín y no tienen otras mascotas en la actualidad?**
   * *Objetivo:* Encontrar candidatos "unicornio", ideales para acoger perros con problemas de reactividad o alta energía que requieren exclusividad y espacio.
3. **¿Qué animales son compatibles con gatos y están listos para adopción?**
   * *Objetivo:* Minimizar los conflictos territoriales y devoluciones en hogares multiespecie.
4. **¿Cuál es el camino de conexión (trazabilidad) entre un adoptante, su nueva mascota y la protectora de origen?**
   * *Objetivo:* Mantener un historial completo para auditorías, seguimientos post-adopción y control legal de la cadena de custodia del animal.
5. **¿Qué casas de acogida tienen disponibilidad en la misma ciudad que la protectora?**
   * *Objetivo:* Agilizar traslados de emergencia cuando una protectora supera su aforo máximo, minimizando el estrés del viaje para el animal.
6. **Recomendación de afinidad (Match 100%): ¿Qué animales encajan de forma perfecta con el perfil de un adoptante específico basándose en espacio, ciudad y convivencia previa?**
   * *Objetivo:* Es el núcleo de la aplicación; generar un *feed* de recomendaciones personalizadas para los adoptantes, aumentando drásticamente la probabilidad de éxito de la adopción.

### 1.3. Naturaleza de los Datos (Lecturas vs Escrituras)

El sistema presenta una carga de trabajo asimétrica, típica de las plataformas de recomendación:

* **Lecturas masivas (Tiempo real):** Constituyen el **90% de las operaciones**. Los usuarios navegan por la app filtrando por ciudad o características, y el motor de recomendación escanea constantemente el grafo buscando patrones de afinidad, calculando distancias y compatibilidades. Estas consultas deben ejecutarse en milisegundos.
* **Escrituras (Puntuales):** Representan el **10% de las operaciones**. Incluyen el registro de nuevos usuarios, la ingesta de datos de un nuevo animal rescatado o la creación de una relación de adopción `[:ADOPTA]`. Son operaciones controladas que mutan el estado del grafo pero con menor frecuencia que las lecturas.

### 1.4. Requisitos de Seguridad, Privacidad (RGPD) y Crecimiento

* **Privacidad de los datos (RGPD):** Dado que se manejan datos de personas físicas (Adoptantes y Casas de Acogida), el diseño del grafo aplica principios de *minimización de datos*. Los nombres reales, teléfonos o direcciones exactas no se almacenan como texto plano en los nodos. Se utilizan identificadores únicos (`id` alfanuméricos) y alias (pseudonimización). Si el sistema requiriese esos datos para logística, se alojarían en una base de datos relacional segura externa, actuando el grafo únicamente como motor analítico de conexiones.
* **Seguridad y Disponibilidad:** Se requiere implementar control de acceso basado en roles (RBAC). Los usuarios de la app móvil (adoptantes) tendrán permisos estrictos de solo lectura (`READ`) sobre partes específicas del grafo, mientras que el personal de las protectoras tendrá permisos de escritura (`WRITE`) limitados a los animales bajo su tutela.
* **Previsión de crecimiento:** El modelo está diseñado para escalar a nivel nacional. Al extraer etiquetas como `:Ciudad` o `:Especie` a nodos independientes, se previene la redundancia de datos. No obstante, se han diseñado estrategias de índices secundarios para evitar el problema de "súper nodos" a medida que la red integre cientos de protectoras y miles de usuarios.