# Práctica 01: Análisis de la red de sensores de calidad del aire

## 1. Comprender el problema

### ¿Quién utilizará estos datos?
El Ayuntamiento. Principalmente los equipos de Medio Ambiente, Tráfico, Protección Civil y Movilidad.

### ¿Qué decisiones se pueden tomar con ellos?
* **A corto plazo (al instante):** Enviar alertas a la población si el aire se vuelve peligroso, cortar el tráfico en zonas muy contaminadas o limitar el paso a los vehículos más contaminantes.
* **A largo plazo (planificación):** Ver si las zonas de bajas emisiones funcionan, cambiar líneas de autobús o planificar dónde construir nuevas zonas verdes o infraestructuras.

### ¿Qué diferencia hay entre una alerta inmediata y un informe histórico?
* **Alerta inmediata:** Necesita datos al segundo o en pocos minutos para detectar subidas raras de contaminación y reaccionar al momento.
* **Informe histórico:** Usa un volumen grande de datos acumulados durante meses o años para ver tendencias, patrones de contaminación y evaluar políticas pasadas.

## 2. Analizar cobertura y calidad

### A. Problemas de calidad y sus consecuencias

1. **Valores extremos (21 registros fuera de rango, como PM10 negativo):**
   * **Consecuencia:** Fastidian las medias de contaminación de la ciudad y pueden hacer que el sistema lance falsas alarmas o que no salte una alerta real cuando debería.
2. **Huecos temporales:**
   * **Consecuencia:** Dejan puntos ciegos en el mapa durante media hora o más, por lo que no sabemos qué calidad de aire respiró la gente en esa zona durante ese tiempo.

### B. Distrito que necesita mayor atención

El distrito prioritario es **D4 (Sur Industrial)** por dos razones claras:
* Es el que peor ratio de sensores, ya que tiene 2,8 sensores por cada 100.000 habitantes, siendo asi el mas bajo de la tabla
* Es una zona de alto riesgo, ya que es el distrito más poblado con 180.000 personas y combina mucho tráfico con actividad industrial.

### C. Gestión de una anomalía

* **Anomalía elegida:** Unidades incorrectas (14 lecturas de temperatura en Fahrenheit, sobre los 70º).
* **Justificación:** No es que el sensor esté roto, es solo un fallo de configuración que ha enviado los datos en otra escala. Se aplica la fórmula matemática de pasar Fahrenheit a Celsius ($C = (F - 32) \times 5/9$) y recuperamos los datos limpios sin tener que tirarlos.

## 3. Comparar arquitecturas

### Tabla comparativa de procesamiento

| Criterio | Batch (Por lotes) | Streaming (Tiempo real) |
| :--- | :--- | :--- |
| **Rapidez para generar alertas** | Lenta (tarda minutos u horas según el lote). | Muy rápida (segundos o muy pocos minutos). |
| **Coste y complejidad** | Más barato y más fácil de montar. | Más caro y bastante más complicado técnicamente. |
| **Informes históricos** | Perfecto para esto; procesa bloques grandes sin problema. | Vale, pero complica las cosas sin necesidad. |
| **Picos de datos** | Fácil de gestionar ajustando las horas de proceso. | Necesita servidores que se adapten solos para no caerse. |

### ¿Qué opción elegir para cada cosa?
* **Para alertas:** **Streaming.** Cuando el aire es tóxico necesitas enterarte al instante, no dentro de dos horas.
* **Para informes históricos:** **Batch.** Es mucho más barato y eficiente para analizar miles de datos guardados de meses anteriores.

## 4. Elaborar una recomendación

### Recomendación para el Ayuntamiento

1. **El riesgo más urgente:**
   Tomar decisiones equivocadas o lanzar alertas falsas por culpa de datos erroneos (valores negativos, datos congelados o sensores raros que no están en el inventario como el S025).

2. **La solución propuesta:**
   Montar un sistema de validación previa de datos. Antes de lanzar una alerta, el sistema en tiempo real debe filtrar los datos ilógicos o marcar los dudosos, y guardar solo los datos limpios en la base de datos principal.

3. **Dos razones basadas en el dossier:**
   * Hay 21 valores fuera de rango físico y 186 mediciones incompletas, lo que demuestra que los datos en bruto no son fiables tal cual entran.
   * La mala cobertura en D4 Sur Industrial, junto a parones de más de 30 minutos, deja sin control a la zona con más gente y más fábrica.

4. **El problema que seguiría pendiente:**
   Si un sensor físico se rompe o entra en mantenimiento (como el S003 durante 2 horas), esa zona se queda a oscuras. La solución no arregla la falta de sensores físicos de repuesto en la calle.

5. **Medida de privacidad:**
   Para las estaciones móviles, no guardar las coordenadas GPS exactas. Es mejor agrupar la ubicación por barrios o zonas redondeadas y promediar los datos cada 15 minutos para que nadie pueda rastrear las rutinas de una persona.
