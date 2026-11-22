# AutoLibrary

Biblioteca digital automotriz en español. La aplicación principal es un frontend React/Vite conectado a Supabase Auth y a sus datos de vehículos. También incluye recursos 3D servidos localmente o desde Cloudflare R2, una API REST Express independiente para pruebas y una estructura PostgreSQL para ese servidor.

## Funciones actuales

- Catálogo de vehículos con búsqueda y filtros por marca, modelo y año.
- Fichas de vehículos con selector de transmisión cuando hay opciones registradas.
- Navegación interna entre catálogo, favoritos, mantenimiento y documentos. El logo accesible vuelve al catálogo sin recargar la página.
- Visores 3D interactivos para vehículos y el motor D17A2 completo, con controles de giro y zoom.
- Hotspots informativos del motor configurados en `client/src/data/puntosMotorD17A2.js`; se pueden mostrar u ocultar sin reiniciar el visor.
- Registro con confirmación de contraseña y validación de mínimo 8 caracteres, una letra y un número.
- Secciones de especificaciones, mantenimiento y documentos.
- Sección de documentos conectada a los registros asociados al vehículo en Supabase.
- API Express independiente que puede ejecutarse con datos de demostración en memoria, sin requerir PostgreSQL.
- Esquema y semilla SQL para cambiar el repositorio a PostgreSQL más adelante.
- Diseño adaptable a escritorio y móvil, con interfaz en español.

Los datos ampliados de algunas fichas y los intervalos de mantenimiento siguen pendientes de validación. No se incluyen manuales ni diagramas ficticios.

## Manuales PDF

La sección Documentos consulta `public.documentos` mediante la relación del vehículo seleccionado. Configura `VITE_R2_MANUALES_BASE_URL` en el entorno de `client/` con la URL pública base del bucket `autolibrary-manuales`; no reutilices `VITE_R2_BASE_URL`, que corresponde a los modelos 3D.

`database/insertar_manuales.sql` contiene inserciones idempotentes para los IDs verificados del Honda Civic 2003 D17A2 y el Ford Fiesta 2014. El script no se ejecuta desde la aplicación: revísalo y ejecútalo manualmente en Supabase para que los PDF aparezcan. No elimina ni actualiza documentos existentes.

## Autenticación

Supabase Auth gestiona las contraseñas. El formulario de registro valida la confirmación y los requisitos de contraseña antes de enviar la solicitud; el inicio de sesión no aplica esa nueva regla desde el cliente para permitir contraseñas heredadas. No se guardan contraseñas en `localStorage` ni en `profiles`.

La validación del frontend no es una política del servidor. Supabase permite configurar longitud y requisitos de contraseña en los ajustes de autenticación del proyecto. Antes de endurecer esa política, verifica su efecto sobre usuarios existentes: las contraseñas débiles pueden afectar su inicio de sesión. Consulta la [documentación de seguridad de contraseñas de Supabase](https://supabase.com/docs/guides/auth/password-security).

## Estructura del proyecto

- **client/**: aplicación React con Vite.
  - **client/src/AutoLibrary.jsx** y **AutoLibrary.css**: navegación y vistas de catálogo, fichas y secciones.
  - **client/src/components/MotorViewer.jsx**: visor interactivo del motor D17A2.
  - **client/src/data/puntosMotorD17A2.js**: definición de hotspots del motor.
  - **client/src/main.jsx**: punto de entrada de React.
  - **client/public/models/**: modelos 3D disponibles como recursos estáticos.
- **server/**: API opcional Node.js con Express.
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

La separación generada es espacial y no representa necesariamente piezas mecánicas reales ni un despiece validado por Honda. El visor del motor usa el GLB completo original; los puntos informativos se mantienen aparte en JavaScript y no modifican el modelo.

## Requisitos

- Node.js y npm.
- Para la base de datos opcional: PostgreSQL.
- Para volver a generar el modelo dividido: Python y las dependencias indicadas arriba.

## Instalación y ejecución en VS Code

Configura el frontend en `client/.env.local` con los datos del proyecto Supabase y, si vas a servir manuales, la URL pública base del bucket de manuales:

    VITE_SUPABASE_URL=<URL-del-proyecto>
    VITE_SUPABASE_PUBLISHABLE_KEY=<clave-publishable>
    VITE_R2_MANUALES_BASE_URL=<URL-publica-del-bucket-autolibrary-manuales>

`VITE_R2_BASE_URL` es independiente y corresponde a los modelos 3D. Si falta `VITE_R2_MANUALES_BASE_URL`, los PDF que requieren esa base no podrán abrirse.

**Terminal — frontend:**

    cd client
    npm install
    npm run dev

Vite muestra la dirección local del frontend; normalmente es http://localhost:5173. La interfaz consulta Supabase directamente; el servidor Express no es necesario para ejecutar el frontend.

**API Express opcional — otra terminal:**

    cd server
    npm install
    npm run dev

La API se inicia en http://localhost:4000. Puedes comprobar su estado en http://localhost:4000/api/health.

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

La API Express es independiente del frontend. El backend usa `PORT` (predeterminado 4000) y `CLIENT_ORIGIN` (predeterminado http://localhost:5173) para el puerto y el origen CORS.

## Datos de prueba

La API Express usa **server/src/data/vehicles.js** como fuente de demostración en memoria. La aplicación React consulta los vehículos, favoritos y documentos asociados mediante Supabase; la disponibilidad de ese contenido depende de los registros y permisos del proyecto.

## PostgreSQL

La conexión a la base de datos está preparada en el repositorio del servidor. Para utilizarla:

1. Crea una base de datos llamada autolibrary.
2. Ejecuta **database/schema.sql** y después **database/seed.sql**.
3. Configura DATABASE_URL en el entorno desde el que iniciarás el backend.

Cuando el proceso del servidor recibe DATABASE_URL, la API usa PostgreSQL; sin esa variable, usa el repositorio en memoria. **server/.env.example** muestra el formato de configuración. Actualmente el servidor no carga archivos .env automáticamente; define la variable en el entorno de VS Code o en la sesión de terminal antes de iniciarlo.

El esquema separa marcas, modelos, vehículos, transmisiones, puntos de mantenimiento y documentos. PostgreSQL es opcional para ejecutar la versión actual.

## Dependencias principales

- Frontend: React, React DOM, Vite, Oxlint y Supabase JS.
- Visores 3D: Three.js, React Three Fiber y Drei.
- Backend: Express, CORS y pg para PostgreSQL.

Los archivos package-lock.json de client/ y server/ registran las dependencias instaladas de cada parte.