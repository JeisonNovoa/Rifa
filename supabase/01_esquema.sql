-- =============================================================================
-- RIFA APP — Esquema de base de datos (Supabase / Postgres)
-- Archivo 1 de 2: tablas, seguridad (RLS) y funciones de negocio
--
-- CÓMO EJECUTARLO:
--   1. Entra a tu proyecto en https://supabase.com/dashboard
--   2. SQL Editor → New query → pega TODO este archivo → Run
--   3. Después ejecuta 02_seed.sql
--
-- DISEÑO (ver PLAN.md):
--   - Máquina de estados del número:
--       disponible → reservado → en_revision → vendido
--       (una reserva expira a los N minutos y vuelve a disponible)
--   - El público NUNCA lee las tablas directamente: solo las vistas
--     `tablero` y `rifa_publica`, que no exponen datos personales.
--   - Toda ESCRITURA pasa por funciones (RPC) que solo puede ejecutar el
--     servidor Next.js con la llave service_role. El navegador no escribe nada.
--   - Cada transición de estado queda registrada en `audit_log`.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tipos enumerados
-- -----------------------------------------------------------------------------
create type public.ticket_estado as enum ('disponible', 'reservado', 'en_revision', 'vendido');
create type public.rifa_estado   as enum ('activa', 'cerrada');

-- -----------------------------------------------------------------------------
-- 2. Tablas
-- -----------------------------------------------------------------------------

-- La rifa (una sola por ahora; la tabla queda lista para futuras)
create table public.raffles (
  id                 uuid primary key default gen_random_uuid(),
  nombre             text not null,
  premio             text,
  precio_por_numero  integer not null check (precio_por_numero > 0),
  total_numeros      integer not null default 100 check (total_numeros > 0),
  estado             public.rifa_estado not null default 'activa',
  fecha_sorteo       date,
  numero_ganador     integer,
  -- Datos de pago que se MUESTRAN al comprador (nunca se piden datos bancarios)
  nequi_llave        text,
  nequi_numero       text,
  nequi_qr_url       text,
  minutos_reserva    integer not null default 10 check (minutos_reserva between 5 and 120),
  creado_en          timestamptz not null default now()
);

-- Los 100 números de la rifa
create table public.tickets (
  id                  uuid primary key default gen_random_uuid(),
  raffle_id           uuid not null references public.raffles (id) on delete cascade,
  numero              integer not null check (numero >= 0),
  estado              public.ticket_estado not null default 'disponible',
  -- Cuándo vence la reserva actual (solo aplica en estado 'reservado')
  reservado_hasta     timestamptz,
  -- Datos del comprador (PII: jamás visibles para el público, ver vistas/RLS)
  comprador_nombre    text,
  comprador_whatsapp  text,
  -- Token secreto que recibe el comprador al reservar; le permite subir su
  -- comprobante sin tener cuenta. Sin el token, nadie puede tocar el ticket.
  token_gestion       uuid,
  comprobante_url     text,
  creado_en           timestamptz not null default now(),
  actualizado_en      timestamptz not null default now(),
  confirmado_en       timestamptz,
  unique (raffle_id, numero)
);

-- Historial completo de transiciones (trazabilidad ante reclamos)
create table public.audit_log (
  id               bigint generated always as identity primary key,
  ticket_id        uuid references public.tickets (id) on delete set null,
  accion           text not null,
  estado_anterior  public.ticket_estado,
  estado_nuevo     public.ticket_estado,
  actor            text not null check (actor in ('sistema', 'comprador', 'admin')),
  detalle          jsonb,
  creado_en        timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 3. Índices
-- -----------------------------------------------------------------------------
create index idx_tickets_raffle_estado  on public.tickets (raffle_id, estado);
create index idx_tickets_reserva_expira on public.tickets (reservado_hasta) where estado = 'reservado';
create index idx_audit_ticket           on public.audit_log (ticket_id, creado_en);

-- -----------------------------------------------------------------------------
-- 4. Trigger: mantener actualizado_en
-- -----------------------------------------------------------------------------
create or replace function public.fn_actualizado_en()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

create trigger trg_tickets_actualizado
before update on public.tickets
for each row execute function public.fn_actualizado_en();

-- -----------------------------------------------------------------------------
-- 5. Seguridad: RLS + revocación de acceso directo
--    Las tablas quedan cerradas para anon/authenticated. El único acceso
--    público es a través de las vistas de la sección 6.
-- -----------------------------------------------------------------------------
alter table public.raffles   enable row level security;
alter table public.tickets   enable row level security;
alter table public.audit_log enable row level security;

-- Sin políticas definidas + RLS activo = nadie (salvo service_role) entra.
-- Defensa en profundidad: revocamos también los grants por defecto de Supabase.
revoke all on table public.raffles   from anon, authenticated;
revoke all on table public.tickets   from anon, authenticated;
revoke all on table public.audit_log from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 6. Vistas públicas (sin datos personales)
--    security_invoker = false ES INTENCIONAL: la vista corre con permisos del
--    dueño (postgres) para poder leer las tablas cerradas, pero solo expone
--    columnas seguras.
-- -----------------------------------------------------------------------------

-- El tablero 00-99 que ve todo el mundo.
-- Truco clave: si una reserva ya expiró, aquí se muestra como 'disponible'
-- al instante, aunque el barrido de limpieza aún no haya corrido.
create view public.tablero
with (security_invoker = false) as
select
  t.raffle_id,
  t.numero,
  case
    when t.estado = 'reservado' and t.reservado_hasta < now()
      then 'disponible'::public.ticket_estado
    else t.estado
  end as estado,
  case
    when t.estado = 'reservado' and t.reservado_hasta >= now()
      then t.reservado_hasta
  end as reservado_hasta
from public.tickets t;

-- Información pública de la rifa (incluye los datos de pago a MOSTRAR)
create view public.rifa_publica
with (security_invoker = false) as
select
  r.id, r.nombre, r.premio, r.precio_por_numero, r.total_numeros,
  r.estado, r.fecha_sorteo, r.numero_ganador,
  r.nequi_llave, r.nequi_numero, r.nequi_qr_url, r.minutos_reserva
from public.raffles r;

grant select on public.tablero      to anon, authenticated;
grant select on public.rifa_publica to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 7. Funciones de negocio (RPC)
--    Todas son SECURITY DEFINER y solo ejecutables por service_role:
--    el servidor Next.js es el único punto de entrada de escrituras.
-- -----------------------------------------------------------------------------

-- 7.1 Reservar un número --------------------------------------------------------
-- Transacción atómica: bloquea la fila (FOR UPDATE) para que dos personas
-- jamás puedan reservar el mismo número al mismo tiempo.
create or replace function public.reservar_numero(
  p_raffle_id uuid,
  p_numero    integer,
  p_nombre    text,
  p_whatsapp  text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rifa     public.raffles%rowtype;
  v_ticket   public.tickets%rowtype;
  v_nombre   text;
  v_whatsapp text;
  v_token    uuid := gen_random_uuid();
  v_hasta    timestamptz;
begin
  -- Validación de entradas (el cliente también valida, pero aquí es la ley)
  v_nombre := left(trim(coalesce(p_nombre, '')), 80);
  if length(v_nombre) < 2 then
    return jsonb_build_object('ok', false, 'error', 'nombre_invalido');
  end if;

  -- Normalizar WhatsApp: quitar todo lo que no sea dígito y el prefijo 57
  v_whatsapp := regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g');
  if length(v_whatsapp) = 12 and v_whatsapp like '57%' then
    v_whatsapp := substring(v_whatsapp from 3);
  end if;
  if v_whatsapp !~ '^3[0-9]{9}$' then
    return jsonb_build_object('ok', false, 'error', 'whatsapp_invalido');
  end if;

  select * into v_rifa from public.raffles where id = p_raffle_id;
  if not found or v_rifa.estado <> 'activa' then
    return jsonb_build_object('ok', false, 'error', 'rifa_no_activa');
  end if;

  -- Bloqueo pesimista de la fila del número
  select * into v_ticket
  from public.tickets
  where raffle_id = p_raffle_id and numero = p_numero
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'numero_no_existe');
  end if;

  -- Una reserva vencida se considera disponible (y se audita la liberación)
  if v_ticket.estado = 'reservado' and v_ticket.reservado_hasta < now() then
    insert into public.audit_log (ticket_id, accion, estado_anterior, estado_nuevo, actor, detalle)
    values (
      v_ticket.id, 'liberacion_por_expiracion', 'reservado', 'disponible', 'sistema',
      jsonb_build_object('nombre', v_ticket.comprador_nombre, 'whatsapp', v_ticket.comprador_whatsapp)
    );
    v_ticket.estado := 'disponible';
  end if;

  if v_ticket.estado <> 'disponible' then
    return jsonb_build_object('ok', false, 'error', 'numero_ocupado');
  end if;

  v_hasta := now() + make_interval(mins => v_rifa.minutos_reserva);

  update public.tickets set
    estado             = 'reservado',
    reservado_hasta    = v_hasta,
    comprador_nombre   = v_nombre,
    comprador_whatsapp = v_whatsapp,
    token_gestion      = v_token,
    comprobante_url    = null,
    confirmado_en      = null
  where id = v_ticket.id;

  insert into public.audit_log (ticket_id, accion, estado_anterior, estado_nuevo, actor, detalle)
  values (
    v_ticket.id, 'reserva_creada', 'disponible', 'reservado', 'comprador',
    jsonb_build_object('nombre', v_nombre, 'whatsapp', v_whatsapp, 'hasta', v_hasta)
  );

  return jsonb_build_object(
    'ok', true,
    'ticket_id', v_ticket.id,
    'token', v_token,
    'numero', v_ticket.numero,
    'reservado_hasta', v_hasta
  );
end;
$$;

-- 7.2 Subir comprobante ---------------------------------------------------------
-- El comprador prueba su identidad con el token que recibió al reservar.
-- Se permite re-subir estando 'en_revision' (por si subió la foto equivocada).
create or replace function public.subir_comprobante(
  p_ticket_id       uuid,
  p_token           uuid,
  p_comprobante_url text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket public.tickets%rowtype;
begin
  if p_comprobante_url is null or length(trim(p_comprobante_url)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'comprobante_invalido');
  end if;

  select * into v_ticket from public.tickets where id = p_ticket_id for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'ticket_no_existe');
  end if;
  if v_ticket.token_gestion is null or v_ticket.token_gestion <> p_token then
    return jsonb_build_object('ok', false, 'error', 'token_invalido');
  end if;
  if v_ticket.estado not in ('reservado', 'en_revision') then
    return jsonb_build_object('ok', false, 'error', 'estado_invalido');
  end if;
  if v_ticket.estado = 'reservado' and v_ticket.reservado_hasta < now() then
    return jsonb_build_object('ok', false, 'error', 'reserva_expirada');
  end if;

  update public.tickets set
    estado          = 'en_revision',
    comprobante_url = p_comprobante_url
  where id = v_ticket.id;

  insert into public.audit_log (ticket_id, accion, estado_anterior, estado_nuevo, actor, detalle)
  values (
    v_ticket.id, 'comprobante_subido', v_ticket.estado, 'en_revision', 'comprador',
    jsonb_build_object('comprobante_url', p_comprobante_url)
  );

  return jsonb_build_object('ok', true, 'ticket_id', v_ticket.id, 'estado', 'en_revision');
end;
$$;

-- 7.3 Liberar reservas expiradas (barrido de limpieza) ---------------------------
-- La vista `tablero` ya muestra las expiradas como disponibles al instante;
-- esta función hace la limpieza real de datos. Se invoca al cargar el tablero
-- y/o con un cron de Supabase.
create or replace function public.liberar_expirados()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_liberados integer := 0;
  v_ticket    record;
begin
  for v_ticket in
    select id, comprador_nombre, comprador_whatsapp
    from public.tickets
    where estado = 'reservado' and reservado_hasta < now()
    for update skip locked
  loop
    update public.tickets set
      estado             = 'disponible',
      reservado_hasta    = null,
      comprador_nombre   = null,
      comprador_whatsapp = null,
      token_gestion      = null,
      comprobante_url    = null
    where id = v_ticket.id;

    insert into public.audit_log (ticket_id, accion, estado_anterior, estado_nuevo, actor, detalle)
    values (
      v_ticket.id, 'liberacion_por_expiracion', 'reservado', 'disponible', 'sistema',
      jsonb_build_object('nombre', v_ticket.comprador_nombre, 'whatsapp', v_ticket.comprador_whatsapp)
    );

    v_liberados := v_liberados + 1;
  end loop;

  return v_liberados;
end;
$$;

-- 7.4 Confirmar pago (solo admin, vía panel) -------------------------------------
-- Se permite confirmar desde 'reservado' también: en la vida real alguien puede
-- mandar el comprobante por WhatsApp en vez de subirlo a la página.
create or replace function public.confirmar_pago(p_ticket_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket public.tickets%rowtype;
begin
  select * into v_ticket from public.tickets where id = p_ticket_id for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'ticket_no_existe');
  end if;
  if v_ticket.estado not in ('reservado', 'en_revision') then
    return jsonb_build_object('ok', false, 'error', 'estado_invalido');
  end if;

  update public.tickets set
    estado          = 'vendido',
    reservado_hasta = null,
    confirmado_en   = now()
  where id = v_ticket.id;

  insert into public.audit_log (ticket_id, accion, estado_anterior, estado_nuevo, actor, detalle)
  values (
    v_ticket.id, 'pago_confirmado', v_ticket.estado, 'vendido', 'admin',
    jsonb_build_object('nombre', v_ticket.comprador_nombre, 'whatsapp', v_ticket.comprador_whatsapp)
  );

  return jsonb_build_object('ok', true, 'ticket_id', v_ticket.id, 'estado', 'vendido');
end;
$$;

-- 7.5 Rechazar pago (solo admin, vía panel) --------------------------------------
-- Libera el número y limpia los datos del intento. El historial queda en audit_log.
create or replace function public.rechazar_pago(
  p_ticket_id uuid,
  p_motivo    text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket public.tickets%rowtype;
begin
  select * into v_ticket from public.tickets where id = p_ticket_id for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'ticket_no_existe');
  end if;
  if v_ticket.estado not in ('reservado', 'en_revision') then
    return jsonb_build_object('ok', false, 'error', 'estado_invalido');
  end if;

  update public.tickets set
    estado             = 'disponible',
    reservado_hasta    = null,
    comprador_nombre   = null,
    comprador_whatsapp = null,
    token_gestion      = null,
    comprobante_url    = null
  where id = v_ticket.id;

  insert into public.audit_log (ticket_id, accion, estado_anterior, estado_nuevo, actor, detalle)
  values (
    v_ticket.id, 'pago_rechazado', v_ticket.estado, 'disponible', 'admin',
    jsonb_build_object(
      'motivo', p_motivo,
      'nombre', v_ticket.comprador_nombre,
      'whatsapp', v_ticket.comprador_whatsapp
    )
  );

  return jsonb_build_object('ok', true, 'ticket_id', v_ticket.id, 'estado', 'disponible');
end;
$$;

-- -----------------------------------------------------------------------------
-- 8. Permisos de ejecución: SOLO el servidor (service_role) llama las RPC.
--    Así nadie puede reservar/confirmar saltándose la lógica del servidor.
-- -----------------------------------------------------------------------------
revoke execute on function public.reservar_numero(uuid, integer, text, text) from public, anon, authenticated;
revoke execute on function public.subir_comprobante(uuid, uuid, text)        from public, anon, authenticated;
revoke execute on function public.liberar_expirados()                        from public, anon, authenticated;
revoke execute on function public.confirmar_pago(uuid)                       from public, anon, authenticated;
revoke execute on function public.rechazar_pago(uuid, text)                  from public, anon, authenticated;

grant execute on function public.reservar_numero(uuid, integer, text, text) to service_role;
grant execute on function public.subir_comprobante(uuid, uuid, text)        to service_role;
grant execute on function public.liberar_expirados()                        to service_role;
grant execute on function public.confirmar_pago(uuid)                       to service_role;
grant execute on function public.rechazar_pago(uuid, text)                  to service_role;

-- -----------------------------------------------------------------------------
-- 9. Storage: bucket PRIVADO para comprobantes
--    Sin políticas para anon/authenticated: solo el servidor (service_role)
--    sube archivos y genera URLs firmadas para que el admin los vea.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;

-- =============================================================================
-- FIN — Ahora ejecuta 02_seed.sql
-- =============================================================================
