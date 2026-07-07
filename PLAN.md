# Plan de implementación — App de Rifa (Nequi)

> Documento de planeación. Fuente de verdad antes de escribir código.
> Fecha: 2026-07-06 · Autor: Jeison · Estado: **Borrador para revisión**

---

## 1. Objetivo (PRD resumido)

Aplicación web para vender una rifa de **100 números (00–99)** sin pasarela de pago.
La gente escanea un **QR** en una imagen compartida, llega a un tablero, **escoge un número**,
paga por **Nequi** (llave Bre-B o QR), sube el **comprobante**, y el **admin (Jeison)** verifica
el pago contra su Nequi y lo confirma. Al confirmarse, el número queda **vendido** y se
**deshabilita en tiempo real** para todos.

**Prioridad #1: cero fricción para el comprador.** No requiere crear cuenta ni instalar nada.

### Métricas de éxito
- Un comprador puede escoger y "apartar" un número en < 30 segundos desde el celular.
- Ningún número queda apartado indefinidamente sin pago (se libera solo).
- Dos personas nunca pueden comprar el mismo número.
- El admin confirma un pago en < 3 clics.

---

## 2. Decisiones tomadas (con el usuario)

| Tema | Decisión |
|---|---|
| Rango de números | 00–99 (100 boletos), precio fijo configurable |
| Reserva | Reserva temporal (15 min) + **comprobante obligatorio** |
| Confirmación de pago | **Manual** por el admin desde un panel privado |
| Método de pago (orden en pantalla) | 1) Llave **Bre-B** + copiar · 2) **QR** Nequi · 3) Número Nequi + copiar |
| Datos del comprador | **Nombre + WhatsApp** |
| Alcance | **Una sola rifa** (tabla `raffles` lista, sin UI multi-rifa) |
| Base de datos | Supabase (Postgres) |
| Storage comprobantes | Supabase Storage |
| Auth | Supabase Auth **solo para el admin**; compradores sin cuenta |
| Despliegue | Fly.io (a cargo del usuario) |

### Sobre el pago Nequi (investigado)
- **NO existe** un deep link público tipo `nequi://pagar?monto=...`. Descartado.
- Los "links de pago" de Nequi Negocios (`checkout.nequi.wompi.co`) requieren cuenta de
  negocio y meten fricción/comisión → descartado para rifa personal.
- **Bre-B** (Banco de la República, 2025) es interoperable: la llave/QR funciona desde
  Nequi, Bancolombia, Daviplata, etc. → **es la mejor opción**, no obliga a tener Nequi.

### ⚠️ Regla de seguridad (crítica en el diseño de UI)
La página **solo MUESTRA** la llave/QR del admin para recibir plata.
**NUNCA** pide datos bancarios ni pide "registrar llaves". Nequi advierte que registrar
llaves solo se hace dentro de su app; imitarlo sería phishing. Se pondrá un aviso visible
de confianza.

---

## 3. Máquina de estados del número (núcleo del sistema)

```
DISPONIBLE ──escoge──► RESERVADO ──sube comprobante──► EN_REVISION ──admin confirma──► VENDIDO
    ▲                     │                                  │
    │                     │ timeout 15 min                   │ admin rechaza
    └─────────────────────┴──────────────────────────────────┘
                     (vuelve a DISPONIBLE)
```

- La **verdad del pago es la app de Nequi del admin**; el comprobante es solo ayuda visual.
- La expiración se calcula con `reservado_hasta` (timestamp en DB), **no** con timers del
  navegador. Si el comprador cierra la pestaña, igual se libera.
- Transiciones ejecutadas en el **servidor** dentro de transacciones para evitar carreras.

---

## 4. Arquitectura técnica

- **Framework:** Next.js (App Router) — frontend + backend juntos, Docker en Fly.
- **Estilos:** Tailwind CSS — mobile-first (la mayoría entra por celular vía QR).
- **DB:** Supabase Postgres. **Realtime** para actualizar el tablero al instante.
- **Storage:** Supabase Storage (bucket privado para comprobantes).
- **Lógica de reserva/liberación:** funciones SQL (RPC) + Server Actions. Nunca en el cliente.

### Modelo de datos

```sql
raffles
  id, nombre, precio_por_numero, total_numeros DEFAULT 100,
  nequi_llave, nequi_qr_url, nequi_numero,
  estado ('activa' | 'cerrada'),
  fecha_sorteo, numero_ganador, creado_en

tickets
  id, raffle_id (fk),
  numero (0..99),
  estado ('disponible' | 'reservado' | 'en_revision' | 'vendido'),
  reservado_hasta (timestamptz, nullable),
  comprador_nombre, comprador_whatsapp,
  comprobante_url (nullable),
  creado_en, actualizado_en, confirmado_en (nullable)
  UNIQUE (raffle_id, numero)

audit_log
  id, ticket_id (fk), accion, estado_anterior, estado_nuevo,
  actor ('sistema' | 'comprador' | 'admin'), detalle, creado_en
```

### Seguridad (RLS — Row Level Security en Supabase)
- Público (anon): puede **leer** el tablero (número + estado, sin datos personales) y
  **reservar** vía RPC controlada. No puede leer teléfonos ni comprobantes de otros.
- Admin (authenticated): acceso total al panel, comprobantes y confirmaciones.
- Bucket de comprobantes: **privado**, acceso solo con URL firmada para el admin.

---

## 5. Funciones clave del servidor (RPC / Server Actions)

1. `reservar_numero(raffle_id, numero, nombre, whatsapp)` — transacción:
   - Verifica que esté `disponible` (o `reservado` y ya expirado → lo re-toma).
   - Lo pone `reservado`, setea `reservado_hasta = now() + 15 min`.
   - Devuelve error claro si ya lo tomó otra persona.
2. `subir_comprobante(ticket_id, archivo)` → estado `en_revision`, guarda URL.
3. `liberar_expirados()` — pone `disponible` los `reservado` con `reservado_hasta < now()`.
   Se ejecuta: (a) al cargar el tablero, (b) opcional cron de Supabase cada 1–5 min.
4. `confirmar_pago(ticket_id)` [admin] → `vendido`, `confirmado_en = now()`.
5. `rechazar_pago(ticket_id)` [admin] → `disponible`, limpia datos/comprobante.

Toda transición escribe en `audit_log`.

---

## 6. Pantallas

**Públicas (mobile-first):**
- `/` o `/rifa/[id]` — Tablero 00–99. Verde=disponible, gris=ocupado. Contador vendidos.
- Modal "Escoger número" — pide Nombre + WhatsApp → reserva.
- Pantalla "Paga con Nequi" — llave Bre-B (copiar), QR, número (copiar), monto, aviso de
  seguridad, botón "Ya pagué → subir comprobante", **cuenta regresiva** de la reserva.
- Pantalla "En revisión" — "Tu número está apartado, el organizador confirmará el pago."
- `/ganador` — se muestra cuando la rifa cierra.

**Admin (protegida):**
- `/admin` login.
- `/admin/panel` — pestañas: En revisión (con vista del comprobante, confirmar/rechazar),
  Vendidos, Reservados activos, Config de la rifa (llave, QR, precio, fecha), Cerrar rifa /
  registrar ganador.

---

## 7. Fases de implementación

| Fase | Entregable | Estado |
|---|---|---|
| 0 | Proyecto Next.js + Tailwind + cliente Supabase + esquema SQL + seed 100 números | ✅ 2026-07-06 |
| 1 | Tablero público 00–99 responsive (sin pagos) | ✅ 2026-07-06 |
| 2 | Reserva 15 min + pantalla pago Nequi + subir comprobante → en_revision | ✅ 2026-07-06 |
| 3 | Panel admin (login, ver comprobante, confirmar/rechazar, liberar expirados, venta manual, revertir venta, configuración editable + QR) | ✅ 2026-07-06 |
| 4 | Página de ganador + cierre/reapertura de rifa + venta manual post-cierre (realtime resuelto con polling 10s + vista que enmascara expirados — suficiente para 100 números) | ✅ 2026-07-06 |
| 5 | Imagen QR para compartir, textos de confianza, manejo de errores, pruebas | ☐ |

Cada fase deja algo funcional y verificable.

---

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Comprobante falso / no pagó | Admin verifica **contra su Nequi real** antes de confirmar. Comprobante es secundario. |
| Dos personas mismo número | Transacción atómica en DB + `UNIQUE(raffle_id, numero)`. |
| Número apartado sin pagar | Auto-liberación a los 15 min vía `reservado_hasta`. |
| Que parezca phishing | Aviso de seguridad; la app solo muestra la llave, nunca pide datos bancarios. |
| Pérdida de datos/reclamos | `audit_log` con historial completo de cada número. |
| Datos personales expuestos | RLS: el público no puede leer teléfonos/comprobantes ajenos. |

---

## 9. Fuera de alcance (por ahora)
- UI para crear/administrar múltiples rifas.
- Pasarela de pago automática.
- Notificaciones automáticas por WhatsApp (se hace manual).
- Sorteo automático / integración con Lotería (el ganador se registra a mano).

---

## 10. Parámetros de esta rifa (definidos 2026-07-06)
- [x] Precio por número: **$60.000 COP** (recaudo total si se vende todo: $6.000.000)
- [x] Fecha del sorteo: **sábado 26 de septiembre de 2026**
- [x] Llave Bre-B / número Nequi: **3504485392** (tipo celular)
- [x] Tiempo de reserva: **15 minutos**

Pendientes (no bloquean la construcción):
- [x] Nombre: **"Viaja por Colombia"** · Premio: viaje para 2 + $500.000 viáticos, 4 destinos a elegir. Juega con las 2 últimas cifras del premio mayor de la **Lotería de Boyacá**.
- [ ] Imagen del QR de Nequi (se sube a la config cuando la tengas).
- [ ] ⚠️ Al terminar el proyecto: **rotar la llave secreta** de Supabase (quedó pegada en el chat) y actualizar `.env.local` + secrets de Fly.
