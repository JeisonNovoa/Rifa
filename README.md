# 🎟️ Rifa App

Aplicación web para vender una rifa de 100 números (00–99) **sin pasarela de pago**:
la gente escoge su número, paga por Nequi (llave Bre-B / QR / número) y sube el
comprobante; el organizador verifica el pago en su Nequi y confirma desde un panel
privado. Ver [PLAN.md](./PLAN.md) para el diseño completo.

## Stack

- **Next.js 16** (App Router, TypeScript) + **Tailwind CSS v4**
- **Supabase**: Postgres (estados de los números), Storage (comprobantes), Auth (solo admin)
- **Fly.io** para el despliegue

## Configuración inicial (una sola vez)

### 1. Crear el proyecto en Supabase

1. Entra a [supabase.com/dashboard](https://supabase.com/dashboard) → **New project** (plan gratis).
2. En **SQL Editor**, ejecuta en orden:
   - [`supabase/01_esquema.sql`](./supabase/01_esquema.sql) — tablas, seguridad y funciones
   - [`supabase/02_seed.sql`](./supabase/02_seed.sql) — crea la rifa y los 100 números
3. La verificación al final del seed debe mostrar: `rifas: 1, tickets: 100, disponibles: 100`.

### 2. Variables de entorno

```bash
cp .env.example .env.local
```

Llena los valores desde **Settings (⚙️) → API Keys** del dashboard de Supabase
(sistema nuevo: llaves `publishable` y `secret`).

> ⚠️ `SUPABASE_SECRET_KEY` (sb_secret_...) es secreta: solo vive en `.env.local`
> (ignorado por git) y en los secrets de Fly. Jamás con prefijo `NEXT_PUBLIC_`.

### 3. Correr en local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Despliegue en Fly.io

```bash
fly secrets set SUPABASE_SECRET_KEY=...
```

> ⚠️ **Importante con Docker/Fly:** las variables `NEXT_PUBLIC_*` se **incrustan
> en el build**, no se leen al arrancar el contenedor. Deben estar disponibles
> como build args al momento de `fly deploy` (o definidas en el Dockerfile),
> no solo como secrets de runtime.

## Estructura

```
supabase/            Esquema SQL y seed (se ejecutan en el SQL Editor de Supabase)
src/lib/types.ts     Tipos del dominio (espejo del esquema SQL)
src/lib/constants.ts Validaciones y mensajes de error compartidos
src/lib/supabase/    Clientes: navegador (lectura), servidor (sesión), admin (RPCs)
src/app/             Páginas y rutas (App Router)
PLAN.md              Documento de planeación: arquitectura, fases, riesgos
```

## Seguridad (resumen)

- Las tablas están **cerradas** al público (RLS sin políticas + revoke).
- El público solo lee las vistas `tablero` y `rifa_publica` (sin datos personales).
- Toda escritura pasa por **RPCs que solo ejecuta el servidor** (service_role).
- El comprador maneja su reserva con un **token secreto** (sin crear cuenta).
- Comprobantes en bucket **privado**; el admin los ve con URLs firmadas.
- La app **solo muestra** la llave Nequi para pagar. Nunca pide datos bancarios
  ni registro de llaves (eso sería phishing — aviso visible en la UI).
