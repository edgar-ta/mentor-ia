# MentorIA

Plataforma SaaS para gestión y seguimiento de mentorías y coaching profesional. Stack: React + Vite (frontend), Node/Express + MySQL (backend).

## Estructura
- `frontend`: Vite + React, proxy a `/api` para el backend.
- `backend`: Express + MySQL, rutas básicas (`/api/metrics`, `/api/clients`, `/api/sessions`, `/api/chat`).

## Cómo levantar localmente
1) Crear la base de datos MySQL:
```bash
mysql -u root -p < backend/schema.sql
```
2) Backend:
```bash
cd backend
cp .env.example .env   # ajusta credenciales
npm install
npm run dev            # puerto 4000
```
3) Frontend:
```bash
cd frontend
npm install
npm run dev            # puerto 5173, proxy a 4000
```

## Datos reales en MySQL
- El script `backend/schema.sql` crea la base, tablas (clients, sessions, goals, campaigns, reminders, mood) y carga datos iniciales.
- El dashboard, CRM, agenda y chatbot leen directamente de MySQL; si el backend no responde se mostrarán errores (no datos mock).

## Practica de busqueda
- La ruta `/buscar` consume `GET /api/search` y `GET /api/search/meta`.
- El catalogo de la practica vive en `backend/data/searchCatalog.js` con 60 registros.
- Para validar los 10 casos del ejercicio:
```bash
cd backend
npm run test:search
```

- El documento breve y la tabla de pruebas quedaron en `docs/practica-busqueda-api.md`.