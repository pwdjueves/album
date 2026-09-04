# Photo Albums

Aplicacion web para crear y completar albumes fotograficos colaborativos. El
frontend ofrece la interfaz React y el backend expone una API REST con
autenticacion, autorizacion por privacidad y persistencia en MySQL.

## Arquitectura

- `frontend/`: React + Vite + TypeScript. Consume la API mediante
  `VITE_API_BASE_URL`.
- `backend/`: Express + TypeScript. Carga variables con `dotenv`, aplica CORS
  y Helmet, y sirve las rutas bajo `/api`.
- `backend/prisma/`: esquema Prisma y migracion inicial para MySQL.

## Requisitos

- Node.js 22 o superior (la version del proyecto esta indicada en `.nvmrc`).
- npm.
- MySQL 8.x ejecutandose localmente.

Apache no es necesario: el proyecto utiliza el servidor de desarrollo de Vite
y Node/Express directamente.

## Instalacion

Desde `C:\Users\User\Desktop\album`:

```powershell
cd backend
npm ci
npx prisma generate

cd ..\frontend
npm ci
```

Los archivos `.env` locales ya estan preparados y estan excluidos por
`.gitignore`. Si se crea un entorno nuevo, copiar los ejemplos:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

## Configuracion de entorno

### Backend

`backend/.env` contiene:

- `DATABASE_URL`: URL MySQL local. El ejemplo usa el usuario de desarrollo
  `album_dev` y no es una credencial de produccion.
- `PORT`: puerto de Express (`3000`).
- `CORS_ORIGIN`: origen permitido del frontend (`http://localhost:5173`).
  Para varios origenes, separarlos por comas.
- `JWT_SECRET`: secreto local. Sustituirlo por un secreto gestionado y largo
  en cualquier entorno compartido o productivo.
- `JWT_EXPIRES_IN`: duracion de los tokens.
- `CLOUDINARY_*`: opcionales para integrar almacenamiento de imagenes.

No publicar `.env` ni reutilizar el secreto local fuera de desarrollo.

### Frontend

`frontend/.env` define `VITE_API_BASE_URL`, normalmente
`http://localhost:3000/api`. Las variables `VITE_*` se incorporan al bundle,
por lo que nunca deben contener secretos.

## Base de datos

Crear la base y un usuario local en MySQL:

```sql
CREATE DATABASE photo_albums CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'album_dev'@'localhost' IDENTIFIED BY 'album_dev_local_password';
GRANT ALL PRIVILEGES ON photo_albums.* TO 'album_dev'@'localhost';
FLUSH PRIVILEGES;
```

Aplicar la migracion versionada:

```powershell
cd backend
npx prisma migrate deploy
```

No hay script de seed definido en el proyecto; no se ejecuta ningun seed
automaticamente.

## Ejecucion

En una terminal:

```powershell
cd backend
npm run dev
```

En otra terminal:

```powershell
cd frontend
npm run dev
```

Abrir `http://localhost:5173`. Para una ejecucion compilada, usar
`npm run build` y `npm start` en `backend`, y `npm run build` seguido de
`npm run preview` en `frontend`.

## Validacion

```powershell
cd backend
npm test

cd ..\frontend
npm run build
```

Los tests del backend compilan TypeScript y ejecutan las pruebas de
autorizacion y validacion; no requieren conectarse a MySQL.
