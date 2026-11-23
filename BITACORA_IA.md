# AutoLibrary — Bitácora de uso de inteligencia artificial

**Proyecto:** AutoLibrary, Biblioteca Digital Automotriz  
**Materia:** Aplicaciones Web  
**Modalidad:** Individual  
**Alumno:** Brian de Jesus Gastelum Fierro
**Período documentado:** 6–22 de noviembre de 2026  
**Repositorio GitHub:** [proyecto_web_Manuales_carros](https://github.com/Deg117/proyecto_web_Manuales_carros)
**Aplicación publicada:** https://autolibrary.deg117.workers.dev/

> **Alcance del registro.** Esta bitácora resume el proceso de desarrollo y las interacciones de IA documentadas durante el proyecto. Distingo entre funciones implementadas, verificaciones que realicé o reporté y comprobaciones que todavía deben contrastarse con el repositorio. Los ejemplos de instrucciones a IA son resúmenes representativos, no transcripciones literales de todos los mensajes.

## 1. Herramientas y forma de trabajo

Utilicé **ChatGPT** para analizar problemas, comparar alternativas, planificar cambios y redactar instrucciones concretas; **Codex en Visual Studio Code** para inspeccionar archivos, modificar componentes de React y realizar comprobaciones de compilación; y herramientas de generación de modelos 3D para obtener referencias o activos iniciales. No consideré que una respuesta de IA fuera correcta por sí sola: comprobé rutas, resultados de SQL, comportamiento de la interfaz y errores reportados por las herramientas.

Mi procedimiento habitual fue:

1. Definir qué función necesitaba y qué archivos podían verse afectados.
2. Pedir a la IA una solución con restricciones explícitas (por ejemplo, no borrar GLB, no modificar Supabase ni romper favoritos).
3. Revisar el código y los resultados de Codex.
4. Probar la aplicación en `http://localhost:5173`, ejecutar `npm run build` y `npm run lint` cuando correspondía.
5. Conservar la solución solamente si resolvía el problema sin afectar lo anterior.

## 2. Registro de interacciones, decisiones y resultados

### Registro 01 — Delimitación de AutoLibrary (inicio del proyecto)

**Necesidad:** entregar una aplicación web automotriz útil dentro de un plazo corto.  
**Uso de IA:** pedí ayuda para escoger un alcance realista: catálogo de vehículos, fichas técnicas, documentación y visualización 3D.  
**Decisión propia:** prioricé un Honda Civic 2003 EX USDM con motor D17A2 como vehículo más desarrollado y añadí otros modelos con funciones más acotadas.  
**Resultado:** el proyecto evolucionó hacia un catálogo de cinco vehículos: Honda Civic 2003, Ford Fiesta 2014, Chevrolet Camaro 1972, Volkswagen Passat 2010 y Hyundai i10 2025.  
**Criterio:** preferí terminar un flujo demostrable antes que intentar documentar exhaustivamente todos los automóviles.

### Registro 02 — Arquitectura con React, Vite y Supabase

**Necesidad:** separar interfaz, datos y autenticación.  
**Uso de IA:** solicité ayuda para ubicar componentes, consultas, visores y autenticación en archivos diferentes.  
**Decisión propia:** mantener `client/src/AutoLibrary.jsx` como núcleo de navegación y utilizar componentes reutilizables, `public.vehiculos` para el catálogo, `public.favoritos` para favoritos y Supabase Auth para cuentas.  
**Comprobación:** se trabajó con Vite en el puerto 5173 y con un servidor de desarrollo Node para la API local; posteriormente el frontend se preparó para Cloudflare Workers.  
**Aprendizaje:** los identificadores de vehículos usados por favoritos deben ser los reales de la base de datos, no valores de registros locales inventados.

### Registro 03 — Modelos 3D y visualización

**Necesidad:** mostrar vehículos y el motor del Civic en tres dimensiones, con rotación y zoom.  
**Uso de IA:** generé instrucciones para modelos 3D y pedí cambios en los visores React Three Fiber / Three.js.  
**Problema:** algunos modelos resultaron pesados, otros no mostraban fielmente ciertas partes mecánicas y el visor podía consumir muchos recursos gráficos.  
**Decisión propia:** conservar respaldos locales y evitar borrar los archivos GLB durante las integraciones. No asumir que un modelo generado representa cada pieza mecánica con precisión.  
**Resultado:** fichas con modelos de vehículo, controles de cámara, visualización ampliada y carga con mensajes de progreso o estado.

### Registro 04 — Cloudflare R2: calidad frente a tamaño

**Necesidad:** los GLB originales superaban los tamaños cómodos para subirlos junto al frontend. Comprimirlos agresivamente reducía su calidad.  
**Uso de IA:** comparé almacenar el 3D en `client/public/models` frente a servirlo desde Cloudflare R2.  
**Decisión propia:** usar el bucket `autolibrary-modelos` para los originales, conservar algunos modelos locales como respaldo y dejar el frontend en el Worker `autolibrary`.  
**Prueba efectuada:** usé `curl.exe -I` con el encabezado `Origin: https://autolibrary.deg117.workers.dev` para consultar objetos remotos. Los archivos del Camaro, Civic, Passat, i10 y Fiesta respondieron `200 OK` y `Access-Control-Allow-Origin` correspondiente.  
**Error detectado:** la ruta sugerida `motor_civic/motor_seccionado_pbr.glb` devolvió `404`. Al revisar el bucket encontré los nombres reales `motor_civic/base_basic_pbr.glb` y `motor_civic/base_basic_shaded.glb`.  
**Aprendizaje:** una ruta plausible propuesta por IA debe comprobarse contra el nombre exacto del objeto remoto.

### Registro 05 — Documentos: Honda y Fiesta

**Necesidad:** incluir manuales solamente para Honda Civic 2003 y Ford Fiesta 2014.  
**Uso de IA:** solicité estructura de almacenamiento e instrucciones SQL para vincular PDFs con los registros de los vehículos.  
**Decisión propia:** usar el bucket `autolibrary-manuales`, reutilizar `public.documentos` y no crear una tabla por vehículo.  
**Archivos cargados:** `honda/Torque_Culata.pdf`, `honda/honda_manual_de_taller.pdf` y `fiesta/manual_de_propietario.pdf`.  
**Prueba efectuada:** una consulta que relaciona `documentos` y `vehiculos` devolvió tres filas: dos de Honda y una de Fiesta. Posteriormente revisé en la aplicación la sección de documentos.  
**Criterio:** los otros vehículos no reciben documentos ficticios; muestran un estado sin manuales.

### Registro 06 — Error de SQL que rechacé y corregí

**Propuesta de IA:** asignar IDs explícitos a los nuevos registros de `public.documentos` usando `MAX(id) + número`.  
**Qué ocurrió:** PostgreSQL rechazó la inserción:

```text
ERROR: 428C9: cannot insert a non-DEFAULT value into column "id"
DETAIL: Column "id" is an identity column defined as GENERATED ALWAYS.
```

**Mi revisión:** identifiqué que no debía calcular el ID porque PostgreSQL lo genera automáticamente.  
**Corrección aplicada:** repetí el `INSERT` sin incluir `id` en las columnas ni en el `SELECT`.  
**Prueba:** el SQL posterior mostró los tres documentos relacionados con Ford Fiesta 2014 y Honda Civic 2003.  
**Aprendizaje:** antes de aceptar SQL generado por IA es necesario comprobar el esquema verdadero de la tabla; no desactivé las restricciones para ocultar el error.

### Registro 07 — Selección de partes del motor: una limitación real

**Necesidad:** hacer clic en piezas del motor D17A2 para mostrar información técnica y resaltarlas.  
**Hipótesis inicial:** identificar componentes a partir de mallas individuales del GLB.  
**Resultado del análisis de Codex:** el motor contenía **una sola malla/primitiva**, llamada `pieza_01`, sin metadatos suficientes para distinguir alternador, bloque o tapa de válvulas.  
**Decisión propia:** rechacé asignar nombres mecánicos a la malla entera y no dividí el GLB arbitrariamente. Conservé el motor completo y elegí **hotspots** ubicados con coordenadas locales.  
**Error adicional:** una primera incorporación de hotspot provocó que el visor dejara de mostrar el motor; volví temporalmente a una lista vacía para recuperar la visualización y pedí revisar la compatibilidad del componente.  
**Aprendizaje:** una geometría visualmente detallada no garantiza que el archivo tenga piezas independientes seleccionables.

### Registro 08 — Hotspots: trabajo manual y validación de coordenadas

**Uso de IA:** solicité una herramienta de desarrollo para capturar la posición local de la superficie mediante `Alt + clic` y un sistema de marcadores con panel informativo.  
**Trabajo propio:** inspeccioné visualmente el modelo, marqué cinco ubicaciones y aporté estas coordenadas, que no fueron inventadas por la IA:

| Componente | Coordenadas locales `[x, y, z]` |
|---|---|
| Tapa de válvulas | `[0.0101, 1.4239, -0.3875]` |
| Múltiple de admisión | `[0.0175, 1.1848, -0.6249]` |
| Alternador | `[-0.6311, 0.8061, -0.714]` |
| Bloque del motor | `[0.2543, 0.5542, 0.2802]` |
| Cárter de aceite | `[0.0887, 0.1705, -0.1492]` |

**Resultado:** se registraron cinco marcadores que muestran información contextual, sin modificar los materiales de la malla completa. Codex informó que los cinco hotspots y sus paneles se probaron con éxito.  
**Criterio:** los hotspots indican ubicaciones que identifiqué en el modelo; **no significan que las piezas estén separadas físicamente en el GLB**.

### Registro 09 — Rendimiento del motor y revisión de una hipótesis de IA

**Problema:** al girar el motor se percibían tirones.  
**Hipótesis propuesta:** que el evento `onClick` de captura realizaba raycasting pesado durante cada movimiento del mouse.  
**Corrección de criterio:** Codex revisó el comportamiento y reportó que React Three Fiber no incluye los manejadores exclusivos de clic en el raycasting de `pointermove`; por tanto, no podía confirmar esa hipótesis.  
**Mejoras implementadas:** resolución `dpr={1}`, sombras desactivadas, eliminación de oclusión costosa de etiquetas HTML, captura de puntos habilitable solo en desarrollo y `frameloop="demand"` verificado con los controles activos.  
**Resultado reportado por Codex:** mediciones de aproximadamente **127–137 cuadros WebGL/s** durante arrastre en su entorno de prueba; no equivalen necesariamente a la tasa de refresco visible ni garantizan el mismo rendimiento en otro equipo.  
**Criterio:** pedí comparar con y sin hotspots y no atribuir un problema a una causa sin pruebas. También quedó identificada como posible limitación la existencia de dos visores Canvas en la misma ficha del Civic.

### Registro 10 — Mejoras de interfaz y registro de usuarios

**Necesidad:** preparar una navegación intuitiva y evitar errores frecuentes en formularios.  
**Uso de IA:** pedí un botón para mostrar/ocultar hotspots, hacer que el logotipo vuelva al inicio y agregar confirmación de contraseña al registro.  
**Reglas solicitadas:** mínimo ocho caracteres, al menos una letra y un número; no permitir contraseñas distintas, registros repetidos mediante doble clic ni envíos vacíos.  
**Criterio de seguridad:** la verificación de frontend facilita el uso, pero no reemplaza los controles del servidor de Supabase Auth. Tampoco se deben almacenar contraseñas en `localStorage` o en `profiles`.  
**Verificación:** después de aplicar los cambios, comprobé los flujos funcionales relevantes en el navegador, según el seguimiento de pruebas del proyecto.

### Registro 11 — Pruebas de casos límite y entrega

**Necesidad:** la evaluación exige soportar situaciones fuera del flujo ideal.  
**Uso de IA:** elaboré una lista de pruebas para búsqueda inexistente, formularios vacíos o inválidos, acciones repetidas en favoritos, errores de carga y listas sin elementos.  
**Verificación:** revisé los puntos funcionales del proyecto e informé que se comportaban correctamente. Codex también ejecutó `npm run build` y `npm run lint` en varias etapas.  
**Pendiente de integridad documental:** antes de la entrega debo confirmar que el commit final, esta bitácora y el diario de decisiones estén efectivamente subidos a GitHub y que el despliegue corresponda a esa revisión. No basta con que una versión funcione solo en localhost.

## 3. Ejemplos de instrucciones dadas a IA

Los siguientes ejemplos **resumen el tipo de instrucciones** que utilicé; no son transcripciones literales verificadas de mensajes completos:

- **Integración 3D:** «Conecta los GLB de Cloudflare R2, pero conserva la rotación, el zoom y los respaldos locales. No modifiques el motor interactivo si el GLB remoto no conserva piezas independientes».
- **Diagnóstico de piezas:** «Inspecciona mallas y grupos reales del D17A2. No inventes nombres ni ilumines el motor entero cuando solo se quiere una pieza».
- **Rendimiento:** «Compara el visor con y sin hotspots, identifica la causa antes de optimizar y no inventes FPS».
- **Registro:** «Agrega confirmar contraseña, exige al menos ocho caracteres con letras y números, evita doble envío y conserva Supabase Auth».
- **Entrega:** «Revisa casos límite, ejecuta build/lint y no publiques ni hagas commit automáticamente».

## 4. Qué acepté, modifiqué y rechacé

| Propuesta o problema | Mi evaluación | Decisión |
|---|---|---|
| Guardar GLB originales en R2 | Evita depender del límite de archivos estáticos del despliegue | **Acepté** y probé rutas HTTP/CORS |
| Asignar manualmente `documentos.id` | Incompatible con `GENERATED ALWAYS` | **Rechacé la inserción** y corregí el SQL |
| Seleccionar partes por mallas del GLB | El motor tenía una sola malla sin identificación mecánica | **Cambié de estrategia** a hotspots |
| Eliminar `public/models` | Había referencias locales y respaldo del motor | **Decidí conservar** las carpetas |
| Atribuir el lag al raycasting de `onClick` | La prueba no confirmó esa causa | **No acepté la hipótesis** como hecho |
| Agregar funciones grandes justo antes de entregar | Riesgo de romper el flujo principal | **Prioricé estabilidad** y casos límite |

## 5. Evidencias comprobables dentro del proyecto

- Código de los componentes: `client/src/AutoLibrary.jsx`, `client/src/components/MotorViewer.jsx`, `client/src/components/CarViewer.jsx`.
- Coordenadas capturadas: `client/src/data/puntosMotorD17A2.js`.
- Rutas de modelos: `client/src/config/modelos3d.js`.
- Autenticación: `client/src/auth/AuthForm.jsx` y `client/src/auth/AuthContext.jsx`.
- Configuración del Worker: `client/wrangler.jsonc`.
- Base de datos: consultas SQL realizadas en Supabase para verificar tres registros en `public.documentos`.
- Publicación: https://autolibrary.deg117.workers.dev/.

**Evidencia que debe anexarse si está disponible:** capturas de pruebas de la app, error `428C9`, resultado del `SELECT` con tres documentos, salida de `npm run build`/`npm run lint` y hash del commit final. No es necesario inventar capturas o resultados.

## 6. Aprendizaje personal y responsabilidad

La IA aceleró tareas de implementación y me ayudó a explorar alternativas, pero también produjo propuestas que no encajaban con el estado real de mis datos o modelos. Aprendí a pedir cambios pequeños, comprobar el esquema de Supabase, distinguir rutas locales de archivos en R2 y validar las limitaciones físicas de un GLB antes de anunciar selección de piezas individuales.

La decisión técnica más importante fue **no fingir que el motor tenía partes separadas**: mantuve su modelo completo y añadí marcadores vinculados a coordenadas que señalé sobre el objeto. Otro caso claro fue el SQL: corregí una inserción incorrecta en lugar de alterar las restricciones de PostgreSQL. Mi responsabilidad fue definir el objetivo, probar los resultados y decidir qué cambios aceptar.

---

*Documento elaborado con apoyo de ChatGPT a partir del historial de trabajo de AutoLibrary. Revisado y adaptado por el responsable del proyecto antes de su entrega.*
