-- =============================================================================
-- 04 — SISTEMA DE ABONOS (pago por partes)
--
-- Reglas del flyer:
--   · Se aparta el número con mínimo $20.000
--   · Se puede seguir abonando (p. ej. quincenal) hasta completar $60.000
--   · Plazo máximo: 26 de septiembre de 2026, 5:00 p.m.
--   · Boleta que no esté 100% paga NO juega
--
-- CÓMO EJECUTARLO: pega TODO el archivo en el SQL Editor de Supabase → Run.
-- (Si saliera el error "unsafe use of new value", corre primero la línea del
--  ALTER TYPE sola y luego el resto del archivo.)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Nuevo estado del ciclo de vida: apartado con abonos sin completar
--    disponible → reservado → en_revision → ABONADO → vendido
-- -----------------------------------------------------------------------------
alter type public.ticket_estado add value if not exists 'abonado';

-- -----------------------------------------------------------------------------
-- 2. Campos nuevos
-- -----------------------------------------------------------------------------
alter table public.tickets
  add column if not exists total_abonado integer not null default 0 check (total_abonado >= 0);

alter table public.raffles
  add column if not exists abono_minimo integer not null default 20000 check (abono_minimo > 0);

alter table public.raffles
  add column if not exists limite_pago timestamptz;

-- Plazo del flyer: 26 de septiembre de 2026, 5:00 p.m. (hora Colombia)
update public.raffles
set limite_pago = timestamptz '2026-09-26 17:00:00-05'
where limite_pago is null;

-- Premio actualizado al flyer nuevo (2 destinos, 2 días / 1 noche)
update public.raffles
set premio = 'Viaje para 2 personas (2 días, 1 noche) + $500.000 de viáticos. El ganador elige el destino: Norcasia (Caldas) o el Cañón del Río Güejar (Meta).';

-- -----------------------------------------------------------------------------
-- 3. Tabla de abonos: cada pago (o intento de pago) con su historia
-- -----------------------------------------------------------------------------
create table if not exists public.abonos (
  id               uuid primary key default gen_random_uuid(),
  ticket_id        uuid not null references public.tickets (id) on delete cascade,
  monto            integer not null check (monto > 0),
  comprobante_url  text,
  estado           text not null default 'en_revision'
                     check (estado in ('en_revision', 'confirmado', 'rechazado')),
  motivo_rechazo   text,
  creado_en        timestamptz not null default now(),
  resuelto_en      timestamptz
);

create index if not exists idx_abonos_ticket     on public.abonos (ticket_id, creado_en);
create index if not exists idx_abonos_pendientes on public.abonos (estado) where estado = 'en_revision';

alter table public.abonos enable row level security;
revoke all on table public.abonos from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. Vista pública de la rifa: expone el abono mínimo y el plazo
--    (la vista `tablero` no cambia: el estado 'abonado' fluye solo)
-- -----------------------------------------------------------------------------
create or replace view public.rifa_publica
with (security_invoker = false) as
select
  r.id, r.nombre, r.premio, r.precio_por_numero, r.total_numeros,
  r.estado, r.fecha_sorteo, r.numero_ganador,
  r.nequi_llave, r.nequi_numero, r.nequi_qr_url, r.minutos_reserva,
  r.abono_minimo, r.limite_pago
from public.raffles r;

grant select on public.rifa_publica to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 5. Subir comprobante AHORA registra un abono con su monto declarado
-- -----------------------------------------------------------------------------
drop function if exists public.subir_comprobante(uuid, uuid, text);

create or replace function public.subir_comprobante(
  p_ticket_id       uuid,
  p_token           uuid,
  p_comprobante_url text,
  p_monto           integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket   public.tickets%rowtype;
  v_rifa     public.raffles%rowtype;
  v_restante integer;
  v_abono_id uuid;
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
  if v_ticket.estado not in ('reservado', 'en_revision', 'abonado') then
    return jsonb_build_object('ok', false, 'error', 'estado_invalido');
  end if;
  if v_ticket.estado = 'reservado' and v_ticket.reservado_hasta < now() then
    return jsonb_build_object('ok', false, 'error', 'reserva_expirada');
  end if;

  select * into v_rifa from public.raffles where id = v_ticket.raffle_id;
  v_restante := v_rifa.precio_por_numero - v_ticket.total_abonado;

  -- Validar el monto declarado
  if p_monto is null or p_monto < 1000 or p_monto > v_restante then
    return jsonb_build_object('ok', false, 'error', 'monto_invalido');
  end if;
  -- El PRIMER pago debe ser al menos el abono mínimo (regla del flyer)
  if v_ticket.total_abonado = 0 and p_monto < least(v_rifa.abono_minimo, v_restante) then
    return jsonb_build_object('ok', false, 'error', 'monto_menor_al_minimo');
  end if;

  -- Un solo abono pendiente por boleta: si ya hay uno, se reemplaza
  update public.abonos
  set monto = p_monto, comprobante_url = p_comprobante_url, creado_en = now()
  where ticket_id = v_ticket.id and estado = 'en_revision'
  returning id into v_abono_id;

  if v_abono_id is null then
    insert into public.abonos (ticket_id, monto, comprobante_url)
    values (v_ticket.id, p_monto, p_comprobante_url)
    returning id into v_abono_id;
  end if;

  if v_ticket.estado = 'reservado' then
    update public.tickets
    set estado = 'en_revision', comprobante_url = p_comprobante_url
    where id = v_ticket.id;
  else
    update public.tickets
    set comprobante_url = p_comprobante_url
    where id = v_ticket.id;
  end if;

  insert into public.audit_log (ticket_id, accion, estado_anterior, estado_nuevo, actor, detalle)
  values (
    v_ticket.id, 'abono_subido', v_ticket.estado,
    case when v_ticket.estado = 'reservado'
         then 'en_revision'::public.ticket_estado
         else v_ticket.estado end,
    'comprador',
    jsonb_build_object('monto', p_monto, 'abono_id', v_abono_id)
  );

  return jsonb_build_object('ok', true, 'abono_id', v_abono_id, 'monto', p_monto);
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. Confirmar un abono (admin): suma al total y decide el estado del número
-- -----------------------------------------------------------------------------
create or replace function public.confirmar_abono(
  p_abono_id uuid,
  p_monto    integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_abono  public.abonos%rowtype;
  v_ticket public.tickets%rowtype;
  v_rifa   public.raffles%rowtype;
  v_total  integer;
  v_nuevo  public.ticket_estado;
begin
  if p_monto is null or p_monto < 1000 then
    return jsonb_build_object('ok', false, 'error', 'monto_invalido');
  end if;

  select * into v_abono from public.abonos where id = p_abono_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'abono_no_existe');
  end if;
  if v_abono.estado <> 'en_revision' then
    return jsonb_build_object('ok', false, 'error', 'estado_invalido');
  end if;

  select * into v_ticket from public.tickets where id = v_abono.ticket_id for update;
  select * into v_rifa from public.raffles where id = v_ticket.raffle_id;

  v_total := v_ticket.total_abonado + p_monto;
  if v_total > v_rifa.precio_por_numero then
    return jsonb_build_object('ok', false, 'error', 'monto_invalido');
  end if;

  update public.abonos
  set estado = 'confirmado', monto = p_monto, resuelto_en = now()
  where id = p_abono_id;

  v_nuevo := (case when v_total >= v_rifa.precio_por_numero
                   then 'vendido' else 'abonado' end)::public.ticket_estado;

  update public.tickets
  set total_abonado  = v_total,
      estado         = v_nuevo,
      reservado_hasta = null,
      confirmado_en  = case when v_nuevo = 'vendido' then now() else confirmado_en end
  where id = v_ticket.id;

  insert into public.audit_log (ticket_id, accion, estado_anterior, estado_nuevo, actor, detalle)
  values (
    v_ticket.id, 'abono_confirmado', v_ticket.estado, v_nuevo, 'admin',
    jsonb_build_object('monto', p_monto, 'total', v_total,
                       'nombre', v_ticket.comprador_nombre,
                       'whatsapp', v_ticket.comprador_whatsapp)
  );

  return jsonb_build_object('ok', true, 'estado', v_nuevo, 'total', v_total,
                            'numero', v_ticket.numero);
end;
$$;

-- -----------------------------------------------------------------------------
-- 7. Rechazar un abono. Si era el PRIMER pago (sin plata previa), libera el número.
-- -----------------------------------------------------------------------------
create or replace function public.rechazar_abono(
  p_abono_id uuid,
  p_motivo   text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_abono    public.abonos%rowtype;
  v_ticket   public.tickets%rowtype;
  v_liberado boolean := false;
begin
  select * into v_abono from public.abonos where id = p_abono_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'abono_no_existe');
  end if;
  if v_abono.estado <> 'en_revision' then
    return jsonb_build_object('ok', false, 'error', 'estado_invalido');
  end if;

  select * into v_ticket from public.tickets where id = v_abono.ticket_id for update;

  update public.abonos
  set estado = 'rechazado', motivo_rechazo = p_motivo, resuelto_en = now()
  where id = p_abono_id;

  if v_ticket.estado = 'en_revision' and v_ticket.total_abonado = 0 then
    -- Primer pago rechazado: el número vuelve al ruedo
    update public.tickets
    set estado = 'disponible', reservado_hasta = null,
        comprador_nombre = null, comprador_whatsapp = null,
        token_gestion = null, comprobante_url = null
    where id = v_ticket.id;
    delete from public.abonos where ticket_id = v_ticket.id;
    v_liberado := true;

    insert into public.audit_log (ticket_id, accion, estado_anterior, estado_nuevo, actor, detalle)
    values (v_ticket.id, 'abono_rechazado', 'en_revision', 'disponible', 'admin',
            jsonb_build_object('motivo', p_motivo, 'monto', v_abono.monto,
                               'nombre', v_ticket.comprador_nombre,
                               'whatsapp', v_ticket.comprador_whatsapp));
  else
    -- Abono posterior rechazado: el número sigue apartado con lo ya abonado
    update public.tickets set comprobante_url = null where id = v_ticket.id;

    insert into public.audit_log (ticket_id, accion, estado_anterior, estado_nuevo, actor, detalle)
    values (v_ticket.id, 'abono_rechazado', v_ticket.estado, v_ticket.estado, 'admin',
            jsonb_build_object('motivo', p_motivo, 'monto', v_abono.monto));
  end if;

  return jsonb_build_object('ok', true, 'liberado', v_liberado);
end;
$$;

-- -----------------------------------------------------------------------------
-- 8. Liberar un número (admin) ahora también aplica a 'abonado'.
--    La plata recibida queda registrada en la auditoría antes de limpiar.
-- -----------------------------------------------------------------------------
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
  if v_ticket.estado not in ('reservado', 'en_revision', 'abonado') then
    return jsonb_build_object('ok', false, 'error', 'estado_invalido');
  end if;

  insert into public.audit_log (ticket_id, accion, estado_anterior, estado_nuevo, actor, detalle)
  values (
    v_ticket.id, 'pago_rechazado', v_ticket.estado, 'disponible', 'admin',
    jsonb_build_object(
      'motivo', p_motivo,
      'nombre', v_ticket.comprador_nombre,
      'whatsapp', v_ticket.comprador_whatsapp,
      'total_abonado', v_ticket.total_abonado,
      'abonos_confirmados', (
        select coalesce(jsonb_agg(jsonb_build_object('monto', a.monto, 'fecha', a.resuelto_en)), '[]'::jsonb)
        from public.abonos a
        where a.ticket_id = v_ticket.id and a.estado = 'confirmado'
      )
    )
  );

  delete from public.abonos where ticket_id = v_ticket.id;

  update public.tickets
  set estado = 'disponible', reservado_hasta = null,
      comprador_nombre = null, comprador_whatsapp = null,
      token_gestion = null, comprobante_url = null,
      total_abonado = 0, confirmado_en = null
  where id = v_ticket.id;

  return jsonb_build_object('ok', true, 'ticket_id', v_ticket.id, 'estado', 'disponible');
end;
$$;

-- -----------------------------------------------------------------------------
-- 9. Permisos: solo el servidor (service_role) ejecuta las RPC nuevas
-- -----------------------------------------------------------------------------
revoke execute on function public.subir_comprobante(uuid, uuid, text, integer) from public, anon, authenticated;
revoke execute on function public.confirmar_abono(uuid, integer)               from public, anon, authenticated;
revoke execute on function public.rechazar_abono(uuid, text)                   from public, anon, authenticated;

grant execute on function public.subir_comprobante(uuid, uuid, text, integer) to service_role;
grant execute on function public.confirmar_abono(uuid, integer)               to service_role;
grant execute on function public.rechazar_abono(uuid, text)                   to service_role;

-- =============================================================================
-- FIN — verifica: select abono_minimo, limite_pago from rifa_publica;
-- =============================================================================
