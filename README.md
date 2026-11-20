# AutoLibrary

Biblioteca digital automotriz en español. El proyecto actual contiene un frontend React/Vite, una API REST Express, datos de demostración en memoria, una estructura preparada para PostgreSQL y recursos 3D del Honda Civic 2003. La interfaz ya permite explorar y filtrar el catálogo, consultar la ficha del Civic EX y elegir su transmisión. Los archivos 3D están en el proyecto, pero todavía no hay un visor 3D integrado.

## Funciones actuales

- Catálogo de vehículos con búsqueda y filtros por marca, modelo y año.
- Ficha del Honda Civic 2003 EX con motor D17A2.
- Selector de transmisión automática o manual.
- Secciones de especificaciones, mantenimiento y documentos.
- Estados explícitos para la información de mantenimiento pendiente y los manuales/diagramas aún no incorporados.
- API que consulta datos de prueba en memoria sin requerir PostgreSQL.
- Esquema y semilla SQL para cambiar el repositorio a PostgreSQL más adelante.
- Diseño adaptable a escritorio y móvil, con interfaz en español.

Los datos ampliados de especificaciones y los intervalos de mantenimiento siguen pendientes de validación. No se incluyen manuales ni diagramas ficticios.

## Estructura del proyecto

- **client/**: aplicación React con Vite.
  - **client/src/AutoLibrary.jsx** y **AutoLibrary.css**: interfaz actual.
  - **client/src/main.jsx**: punto de entrada de React.
  - **client/public/models/**: modelos 3D disponibles como recursos estáticos.
- **server/**: API Node.js con Express.
  - **server/src/index.js**: configuración y arranque del servidor.
  - **server/src/routes/vehicles.js**: endpoints de vehículos.
  - **server/src/repositories/vehicleRepository.js**: repositorio en memoria o PostgreSQL, según la configuración.
  - **server/src/data/vehicles.js**: vehículo de prueba.
- **database/schema.sql**: tablas e índices de PostgreSQL.
- **database/seed.sql**: datos iniciales del Civic EX 2003.
- **README.md**: esta guía.

## Recursos 3D presentes

Los modelos GLB incluidos están en **client/public/models/civic-2003/**:

- Carrocería: **car/civic_shaded.glb** y **car/civic_pbr.glb**.
- Motor completo: **engine/complete/motor_pbr.glb**.
- Motor seccionado: **engine/separeted/motor_seccionado_shaded.glb** y **engine/separeted/motor_12_piezas.glb**.

La carpeta se llama **separeted** en el proyecto. El guion **engine/separeted/split.py** divide la malla en grupos espaciales usando centroides de caras y k-means. Recibe la cantidad de grupos, el archivo de entrada y el archivo de salida; si no se indica cantidad usa 12, aunque se deben proporcionar las rutas de entrada y salida:

    python split.py 12 motor_pbr.glb motor_12_piezas.glb

El guion requiere Python y los paquetes **trimesh**, **numpy** y **scipy**. Desde una terminal situada en la carpeta del guion se pueden instalar con:

    python -m pip install trimesh numpy scipy

La separación generada es espacial y no representa necesariamente piezas mecánicas reales ni un despiece validado por Honda. Los modelos y las dependencias **three**, **@react-three/fiber** y **@react-three/drei** están presentes, pero la aplicación todavía no los carga en una experiencia 3D.

## Requisitos

- Node.js y npm.
- Para la base de datos opcional: PostgreSQL.
- Para volver a generar el modelo dividido: Python y las dependencias indicadas arriba.

## Instalación y ejecución en VS Code

Abre dos terminales en la carpeta raíz del proyecto.

**Terminal 1 — API:**

    cd server
    npm install
    npm run dev

La API se inicia en http://localhost:4000. Puedes comprobar su estado en http://localhost:4000/api/health.

**Terminal 2 — frontend:**

    cd client
    npm install
    npm run dev

Vite muestra la dirección local del frontend; normalmente es http://localhost:5173. Mantén ambas terminales abiertas mientras trabajas.

Para compilar el frontend para producción:

    cd client
    npm run build

Para ejecutar el análisis estático del frontend:

    cd client
    npm run lint

## API disponible

Las respuestas de consulta están envueltas en JSON. La lista tiene la forma { "data": [...], "total": n }; una ficha tiene la forma { "data": { ... } }.

- GET /api/health: estado del servidor.
- GET /api/vehicles: lista de vehículos.
- GET /api/vehicles?marca=Honda&modelo=Civic&anio=2003&q=D17A2: filtra por marca, modelo, año y texto de búsqueda. Todos los filtros son opcionales.
- GET /api/vehicles/honda-civic-2003-ex: ficha del vehículo.
- Un identificador inexistente devuelve HTTP 404.

El frontend usa VITE_API_URL si está definida; de lo contrario consulta http://localhost:4000. El backend usa PORT (predeterminado 4000) y CLIENT_ORIGIN (predeterminado http://localhost:5173) para el puerto y el origen CORS.

## Datos de prueba

El registro inicial es el Honda Civic EX 2003, motor D17A2 de 1.7 L, con variantes automática y manual. Sus especificaciones ampliadas, mantenimiento y documentos están vacíos; la interfaz comunica que ese contenido está pendiente. La fuente en memoria es **server/src/data/vehicles.js**.

## PostgreSQL

La conexión a la base de datos está preparada en el repositorio del servidor. Para utilizarla:

1. Crea una base de datos llamada autolibrary.
2. Ejecuta **database/schema.sql** y después **database/seed.sql**.
3. Configura DATABASE_URL en el entorno desde el que iniciarás el backend.

Cuando el proceso del servidor recibe DATABASE_URL, la API usa PostgreSQL; sin esa variable, usa el repositorio en memoria. **server/.env.example** muestra el formato de configuración. Actualmente el servidor no carga archivos .env automáticamente; define la variable en el entorno de VS Code o en la sesión de terminal antes de iniciarlo.

El esquema separa marcas, modelos, vehículos, transmisiones, puntos de mantenimiento y documentos. PostgreSQL es opcional para ejecutar la versión actual.

## Dependencias principales

- Frontend: React, React DOM, Vite y Oxlint.
- Preparación para 3D: Three.js, React Three Fiber y Drei (todavía sin visor en la interfaz).
- Backend: Express, CORS y pg para PostgreSQL.

Los archivos package-lock.json de client/ y server/ registran las dependencias instaladas de cada parte.