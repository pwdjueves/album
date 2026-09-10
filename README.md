# Photo Albums

Aplicacion web para crear y completar albumes fotograficos colaborativos. El
frontend usa React + Vite + TypeScript y el backend usa Express + TypeScript,
Prisma y MySQL.

## Requisitos iniciales

- Windows 10/11.
- Permisos para instalar programas y escribir en la carpeta del proyecto.
- Conexion a internet durante la instalacion.
- Node.js 22 (el proyecto fija esta version en `.nvmrc`) y npm.
- Git, salvo que se descargue el proyecto como ZIP.
- MySQL 8.x local. Apache no es necesario.

## Instalacion desde cero (CMD)

Los bloques siguientes se pueden pegar en **CMD de Windows**, no en
PowerShell. Las partes entre `<...>` se deben adaptar.

### 1. Instalar Node.js, Git y MySQL

1. Instala Node.js 22 LTS desde <https://nodejs.org/>. El instalador incluye
   npm. Cierra y vuelve a abrir CMD y comprueba:

   ```cmd
   node --version
   npm --version
   ```

   `node --version` debe mostrar `v22.x`.

2. Instala Git for Windows desde <https://git-scm.com/download/win>, abre un
   CMD nuevo y comprueba:

   ```cmd
   git --version
   ```

3. Instala MySQL Community Server 8.x desde
   <https://dev.mysql.com/downloads/installer/>. Durante el asistente instala
   MySQL Server, deja el puerto `3306` salvo que ya este ocupado y recuerda la
   contraseña de `root`. Comprueba:

   ```cmd
   mysql --version
   ```

   Si `mysql` no se reconoce, usa la ruta completa de la instalacion, por
   ejemplo `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe`, o agrega
   esa carpeta al `PATH` y abre CMD de nuevo.

   **Alternativa XAMPP:** instala XAMPP desde <https://www.apachefriends.org/>
   y pulsa **Start** en el modulo **MySQL** del panel de control. Apache no
   hace falta. En los comandos de base de datos sustituye `mysql` por
   `C:\xampp\mysql\bin\mysql.exe`; adapta `<CONTRASENA_ROOT>` (en algunas
   instalaciones XAMPP `root` no tiene contraseña).

### 2. Obtener el proyecto

Opcion A, usando Git. Estos comandos descargan el repositorio oficial en el
Escritorio del usuario actual:

```cmd
cd /d %USERPROFILE%\Desktop
git clone https://github.com/pwdjueves/album.git album
cd /d %USERPROFILE%\Desktop\album
```

Opcion B, si se recibio un ZIP: extraelo en
`%USERPROFILE%\Desktop\album` (o en otra ruta) y adapta todos los `cd /d` de
esta guia a esa ruta. Si la carpeta `album` ya existe, usa otra carpeta o
elimina/mueve la copia anterior antes de ejecutar `git clone`.

### 3. Crear la base de datos

Desde la raiz del proyecto, inicia el cliente MySQL (adapta
`<CONTRASENA_ROOT>`):

```cmd
mysql -u root -p
```

En la consola que muestra `mysql>` pega este SQL. Estos son los valores
locales usados por el `.env` de esta guia:

```sql
CREATE DATABASE photo_albums CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

Si el usuario o la contraseña se cambian, hay que reflejarlos exactamente en
`DATABASE_URL` (codifica caracteres especiales de la contraseña como parte de
una URL). Si la base o el usuario ya existen, no repitas `CREATE`; usa las
credenciales existentes y ajusta `DATABASE_URL`.

### 4. Crear los archivos `.env`

Ejecuta desde `%USERPROFILE%\Desktop\album` (adapta la ruta si corresponde):

```cmd
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
notepad backend\.env
notepad frontend\.env
```

Deja `backend\.env` con estos valores. **No publiques este archivo ni lo
subas a Git.** `DATABASE_URL`, `PORT`, `NODE_ENV`, `CORS_ORIGIN`,
`JWT_EXPIRES_IN`, `STORAGE_PROVIDER` y `UPLOAD_DIR` deben quedar exactamente
asi para el desarrollo local:

```dotenv
DATABASE_URL="mysql://album_dev:album_dev_local_password@127.0.0.1:3306/photo_albums"
PORT=3000
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"
JWT_SECRET="<SECRETO_GENERADO_LOCALMENTE>"
JWT_EXPIRES_IN="1h"
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
CLOUDINARY_UPLOAD_PRESET=""
STORAGE_PROVIDER="local"
UPLOAD_DIR="uploads"
```

Genera un secreto local con Node (no uses el texto de ejemplo), copia el
resultado y reemplaza `<SECRETO_GENERADO_LOCALMENTE>` en `backend\.env`:

```cmd
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`JWT_SECRET` es obligatorio. No lo compartas ni lo pongas en el frontend.
`STORAGE_PROVIDER=local` guarda las cargas en `backend\uploads`; las variables
`CLOUDINARY_*` solo se necesitan si se implementa un proveedor Cloudinary.

Deja `frontend\.env` asi:

```dotenv
VITE_API_BASE_URL=http://localhost:3000/api
```

Las variables `VITE_*` se incorporan al navegador y nunca deben contener
secretos.

### 5. Instalar dependencias, generar Prisma, migrar y cargar datos

Tambien puedes ejecutar `setup.bat` desde la raiz del proyecto. El script
comprueba Node.js, npm y el cliente MySQL, crea la base `photo_albums` y el
usuario local, genera los archivos `.env`, instala las dependencias con los
lockfiles, aplica las migraciones y ejecuta el seed. Pedira la contraseña de
`root` de MySQL:

```cmd
cd /d %USERPROFILE%\Desktop\album
setup.bat
```

Si ya existen `.env`, el script los conserva. Revisa que sus valores coincidan
con tu instalacion antes de continuar.

La forma manual equivalente es:

```cmd
cd /d %USERPROFILE%\Desktop\album\backend
npm ci
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
cd /d %USERPROFILE%\Desktop\album\frontend
npm ci
```

`migrate deploy` aplica todas las migraciones versionadas de
`backend\prisma\migrations`. El seed es idempotente y crea categorias, dos
albumes de ejemplo y usuarios de desarrollo.

## Ejecutar en desarrollo

Deja MySQL iniciado y abre dos ventanas de **CMD**.

Despues de ejecutar `setup.bat`, puedes abrir ambas ventanas automaticamente
con:

```cmd
cd /d %USERPROFILE%\Desktop\album
start.bat
```

El script inicia `npm run dev` en backend y frontend. MySQL debe estar
iniciado antes de ejecutarlo.

CMD 1 (backend):

```cmd
cd /d %USERPROFILE%\Desktop\album\backend
npm run dev
```

CMD 2 (frontend):

```cmd
npm ci
cd /d %USERPROFILE%\Desktop\album\frontend
npm run dev
```

Abre <http://localhost:5173>. La API esta en
<http://localhost:3000/api>; las imagenes locales se sirven desde
<http://localhost:3000/uploads/>.

Credenciales creadas por el seed (solo desarrollo):

- `admin@album.local` / `AlbumDev123!`
- `creator@album.local` / `AlbumDev123!`
- `collaborator@album.local` / `AlbumDev123!`

## Solucion de problemas

- **`node`, `npm`, `git` o `mysql` no se reconoce:** instala el programa,
  agrega su carpeta `bin` al `PATH`, cierra CMD y abre una ventana nueva.
- **Error de conexion MySQL (`P1001`, `ECONNREFUSED`):** inicia el servicio
  MySQL/XAMPP, verifica el puerto `3306`, el usuario y la contraseña, y
  comprueba que `DATABASE_URL` coincida con ellos. Si se cambio el puerto,
  actualiza tambien esa URL.
- **`Access denied` o base inexistente:** vuelve a ejecutar el SQL con `root`,
  confirma que `photo_albums` y `album_dev` existen y que la contraseña de
  `DATABASE_URL` coincide. Una contraseña con `@`, `#`, `:` u otros caracteres
  debe codificarse para URL.
- **Puerto ocupado:** cambia `PORT` en `backend\.env` (por ejemplo `3001`),
  cambia `VITE_API_BASE_URL` a `http://localhost:3001/api` y cambia
  `CORS_ORIGIN` al origen real que muestre Vite (por ejemplo
  `http://localhost:5174`). Reinicia ambas terminales.
- **Error CORS:** `CORS_ORIGIN` debe coincidir exactamente con el origen del
  navegador (`http://localhost:5173` o `http://127.0.0.1:5173`), sin mezclar
  ambos valores; reinicia el backend tras editar `.env`.
- **Imagenes o uploads no aparecen:** usa JPEG, PNG o WebP de hasta 5 MB,
  mantén `STORAGE_PROVIDER=local` y comprueba que el backend pueda crear
  `backend\uploads`. Las rutas locales se guardan como `/uploads/<archivo>` y
  se resuelven contra el backend; las URLs HTTPS remotas se conservan.
- **`Invalid authentication token`:** cierra sesion y vuelve a iniciar.
  Si cambiaste `JWT_SECRET`, reinicia el backend y vuelve a iniciar sesion
  para obtener un token nuevo.
- **Prisma falla al generar o migrar:** ejecuta los comandos desde
  `backend`, confirma que existe `backend\.env`, que `DATABASE_URL` es valida
  y que MySQL esta iniciado. No borres las migraciones versionadas.

## Validacion

Estos comandos usan los scripts existentes del proyecto:

```cmd
cd /d %USERPROFILE%\Desktop\album\backend
npm test
cd /d %USERPROFILE%\Desktop\album\frontend
npm run build
```

Los tests del backend compilan TypeScript y ejecutan las pruebas existentes;
no requieren conectarse a MySQL.
