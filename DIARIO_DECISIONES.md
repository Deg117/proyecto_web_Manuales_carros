# Diario de decisiones — AutoLibrary

**Proyecto:** AutoLibrary — Biblioteca Digital Automotriz  
**Asignatura:** Aplicaciones Web  
**Alumno:** Brian de Jesus Gastelum Fierro
**Fecha de elaboración:** 22 de noviembre de 2026  
**Modalidad:** Proyecto individual

## Propósito del diario

Este documento registra las decisiones más importantes que tomé durante el desarrollo de AutoLibrary, las alternativas consideradas, las dificultades que encontré y el papel que tuvo la inteligencia artificial en el proceso. La intención es mostrar no solo qué herramientas utilicé, sino **por qué las elegí, qué problemas surgieron y qué aprendí**.

## Decisión 1. Crear una biblioteca digital automotriz para personas de habla hispana

**Decisión.** Desarrollar un sitio que reúna información de vehículos y documentación útil sobre su cuidado y mantenimiento, con especial atención a la comunidad hispanohablante.

**Motivo.** En ocasiones es complicado encontrar información confiable sobre el cuidado de un vehículo. Además, algunos manuales están disponibles en otros idiomas, lo que dificulta su consulta. Pensé que una plataforma enfocada en usuarios de habla hispana podría facilitar el acceso a esa información y ayudar a comprender mejor los mantenimientos.

**Resultado y aprendizaje.** Esta necesidad dio dirección al proyecto: no quería crear solamente un catálogo de automóviles, sino una biblioteca que relacionara cada vehículo con información y, cuando fuera posible, con manuales. Aprendí que definir al usuario y el problema desde el principio ayuda a decidir qué funciones tienen sentido.

## Decisión 2. Utilizar React para la interfaz

**Decisión.** Construir el frontend con React, utilizando Vite en el entorno de desarrollo.

**Motivo.** React fue una de las tecnologías que trabajamos durante el curso de Aplicaciones Web. Ya tenía cierta familiaridad con ella y, por el momento, desconozco otras opciones de frontend lo suficiente como para compararlas en profundidad.

**Alternativas consideradas.** No realicé una evaluación exhaustiva de otros frameworks. Preferí continuar con una herramienta conocida para dedicar más tiempo a desarrollar las funciones del proyecto.

**Resultado y aprendizaje.** Pude organizar AutoLibrary en componentes e incorporar el catálogo, las fichas y los visores 3D. El proyecto también me permitió practicar React más allá de los ejercicios de clase.

## Decisión 3. Incorporar modelos 3D interactivos

**Decisión.** Añadir visualización tridimensional de vehículos y del motor del Honda Civic.

**Origen de la idea.** La implementación de modelos 3D fue una recomendación del profesor. Decidí tomarla como un reto personal.

**Dificultad inicial.** Pensaba que no lograría incorporar modelos 3D a una aplicación web, ni siquiera con apoyo de inteligencia artificial.

**Resultado y aprendizaje.** Después de varias pruebas, pude integrar modelos que se pueden girar y acercar. Considero que el resultado es aceptable, especialmente por la dificultad que esperaba. Aprendí que una funcionalidad que parece demasiado compleja puede abordarse por etapas, probando y corrigiendo los resultados.

## Decisión 4. Utilizar Supabase en lugar de administrar una base de datos SQL local

**Decisión.** Elegir Supabase para almacenar datos de vehículos, gestionar cuentas y conservar favoritos.

**Plan inicial.** Al comenzar pensaba utilizar una base de datos SQL instalada o administrada localmente.

**Participación de la IA.** La inteligencia artificial me recomendó Supabase como una alternativa.

**Motivo para aceptarla.** Me pareció más sencillo porque podía administrar los datos desde una plataforma web y conectar la aplicación con la URL y las claves que proporciona el servicio, sin mantener una instalación local de PostgreSQL.

**Resultado y aprendizaje.** Supabase se convirtió en parte de la infraestructura de AutoLibrary. Aprendí a conectar una aplicación web con una base de datos remota y a trabajar con autenticación y consultas. También entendí que las claves públicas de conexión no reemplazan los controles de permisos de acceso a los datos.

## Decisión 5. Almacenar los modelos originales en Cloudflare R2

**Decisión.** Guardar los archivos 3D originales en buckets de Cloudflare R2, separados del despliegue de la aplicación.

**Problema.** El límite de tamaño de archivos que encontré al publicar el sitio era de 25 MB por recurso. Para cumplirlo, había comprimido algunos modelos, pero perdían demasiados detalles y se veían mal.

**Investigación.** Busqué cómo evitar que la calidad de los modelos dependiera de ese límite y encontré la opción de utilizar buckets de Cloudflare para almacenar los archivos por separado.

**Criterio y desventaja aceptada.** Preferí conservar los modelos completos, aun sabiendo que descargar archivos más pesados podía incrementar el tiempo de espera.

**Medida complementaria.** Solicité implementar indicadores de carga y manejo de errores para que el usuario supiera que el modelo seguía descargándose y no confundiera la espera con una falla de la página. El indicador puede mostrar un porcentaje cuando el cargador dispone de datos suficientes; no siempre es posible detectar por anticipado una pérdida de conexión.

**Resultado y aprendizaje.** Separé el almacenamiento de los modelos 3D de la aplicación. Aprendí a evaluar un compromiso entre calidad visual, tamaño de descarga y experiencia de usuario.

## Decisión 6. Sustituir la selección de mallas por puntos informativos en el motor D17A2

**Decisión.** Utilizar puntos interactivos situados mediante coordenadas 3D para identificar componentes del motor Honda Civic D17A2.

**Idea original.** Quería que cada pieza del motor se seleccionara directamente, se iluminara y mostrara información técnica.

**Problema.** Al inspeccionar el GLB descubrimos que el motor tenía una sola malla (identificada como `pieza_01`). Aunque se distinguían elementos visualmente, Three.js no podía tratarlos como piezas independientes para resaltarlos individualmente.

**Alternativa propuesta por mí.** Pregunté si sería posible trabajar mediante coordenadas, en lugar de depender de la separación de mallas. Con esa idea y apoyo de IA implementamos una herramienta de captura de posiciones mediante clic sobre el motor.

**Solución aplicada.** Registré posiciones para cinco componentes: tapa de válvulas, múltiple de admisión, alternador, bloque del motor y cárter de aceite. Los marcadores permiten mostrar el nombre y la función de cada componente sin modificar el GLB.

**Limitación reconocida.** Los puntos informativos **no separan ni iluminan físicamente cada pieza** de la malla; identifican ubicaciones seleccionadas sobre el modelo. Decidí no presentar una selección de geometrías que en realidad no existía.

**Resultado y aprendizaje.** Conservé el motor completo y añadí información contextual mediante una alternativa viable. Aprendí a adaptar el diseño de una función a las limitaciones reales de los archivos disponibles.

## Decisión 7. Combinar la revisión personal del código con la ayuda de ChatGPT y Codex

**Decisión.** Usar IA como apoyo para investigar errores, generar propuestas y realizar cambios, pero también intentar comprender y modificar el código personalmente cuando el alcance lo permitiera.

**Forma de trabajo.** Cuando aparecía un error en la terminal, en una consulta SQL o en la página, primero intentaba interpretarlo. Reconozco que todavía no comprendo por completo todos esos mensajes. Si no lograba resolverlo o ya había hecho varios intentos sin éxito, compartía el error con la IA para pedir ayuda.

**Participación personal.** En cambios pequeños procuraba localizar el archivo y el fragmento indicado para hacer la modificación por mi cuenta. Para tareas más extensas utilizaba Codex y después revisaba el resultado y probaba la funcionalidad.

**Ejemplo de error de IA.** En el registro de manuales, una consulta propuesta intentó asignar un ID manualmente a una columna de Supabase definida como `GENERATED ALWAYS`. PostgreSQL rechazó la operación. Se corrigió la instrucción para dejar que la base generara el identificador y después comprobé que los tres documentos estuvieran registrados.

**Ejemplo de revisión técnica.** Ante los tirones del visor 3D se investigó si el raycasting de captura era responsable. Una revisión posterior mostró que el manejador de clic no explicaba por sí solo el trabajo durante `pointermove`; por eso se probaron optimizaciones y se evitó dar por confirmada una causa sin evidencia.

**Resultado y aprendizaje.** La IA me ayudó a avanzar y a conocer mejor la estructura del proyecto, pero también cometió errores o propuso hipótesis que hubo que revisar. Aprendí a comprobar los resultados antes de considerarlos terminados.

## Decisión 8. Limitar la documentación a Honda Civic 2003 y Ford Fiesta 2014

**Decisión.** Concentrar los manuales de la versión entregable en dos vehículos, mientras los demás permanecen como ejemplos del catálogo con modelos 3D e información disponible.

**Idea inicial.** Quería incorporar documentación para varios modelos. Al ver la dificultad para conseguir manuales adecuados, pensé incluso en centrarme en un solo vehículo: el Honda Civic.

**Problema.** Me resultó complicado encontrar manuales para todos los automóviles. Para el Honda reuní dos documentos y para el Fiesta incorporé un manual del propietario. No quería presentar como completa una biblioteca de manuales que todavía no lo estaba.

**Criterio.** Preferí desarrollar lo más posible uno de los vehículos, especialmente el Honda con su motor interactivo, en lugar de intentar completar de manera superficial todos los apartados de todos los autos. Los demás vehículos siguen siendo útiles como muestra de catálogo e interacción 3D, pero su documentación y algunas características quedan pendientes.

**Resultado y aprendizaje.** Definí un alcance alcanzable para el tiempo disponible: dos documentos para Honda Civic 2003 y uno para Ford Fiesta 2014. Aprendí a priorizar funciones terminadas y verificables en vez de prometer una cobertura que todavía no podía sostener.

## Reflexión final

AutoLibrary comenzó como una idea para facilitar la consulta de información automotriz, especialmente en español. Durante su desarrollo tuve que ajustar varias decisiones: elegí herramientas que podía aprender y utilizar, acepté recomendaciones útiles de la IA, investigué alternativas cuando aparecieron limitaciones y cambié funciones que no eran viables tal como las había imaginado.

Mi mayor aprendizaje fue que desarrollar una aplicación no consiste solo en agregar código. También implica **definir prioridades, reconocer limitaciones, interpretar errores, probar las soluciones y explicar por qué se eligió una alternativa**.

La inteligencia artificial fue una herramienta importante, pero las decisiones finales sobre el alcance, la experiencia del usuario y las soluciones adoptadas formaron parte de mi proceso de aprendizaje.

---

**Nota para la entrega:** este diario describe decisiones y resultados del desarrollo. La disponibilidad de cada función en la versión presentada debe comprobarse en el último commit enviado a GitHub y en el despliegue final.
