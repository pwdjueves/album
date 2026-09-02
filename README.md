# Álbumes de Fotos Digitales Interactivos

Estructura inicial del proyecto:

- `frontend/`: React, Vite y TypeScript.
- `backend/`: Express, TypeScript y Prisma configurado para MySQL.

## Requisitos

- Node.js 22 LTS (ver `.nvmrc`)
- MySQL 8.4 LTS para usar la futura conexión de Prisma

## Desarrollo

En terminales separadas:

```bash
cd frontend
npm run dev
```

```bash
cd backend
copy .env.example .env
npm run dev
```

Antes de ejecutar comandos de Prisma, configura `DATABASE_URL` en `backend/.env`.

