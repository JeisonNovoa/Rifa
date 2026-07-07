-- =============================================================================
-- RIFA APP — Datos iniciales (seed)
-- Archivo 2 de 2: crea LA rifa y sus 100 números (00 a 99)
--
-- Ejecutar DESPUÉS de 01_esquema.sql, en el SQL Editor de Supabase.
-- Es seguro correrlo una sola vez. Si necesitas empezar de cero:
--   delete from public.raffles;  -- (borra en cascada tickets y deja audit_log)
-- =============================================================================

with rifa as (
  insert into public.raffles (
    nombre,
    premio,
    precio_por_numero,
    total_numeros,
    estado,
    fecha_sorteo,
    nequi_llave,
    nequi_numero,
    minutos_reserva
  )
  values (
    'Viaja por Colombia',
    'Viaje para 2 personas + $500.000 para viáticos. El ganador elige el destino: Cañón del Río Güejar, Desierto de la Tatacoa, Guatapé y la Piedra del Peñol, o Capurganá.',
    60000,                          -- $60.000 COP por número
    100,
    'activa',
    date '2026-09-26',              -- sábado 26 de septiembre de 2026
    '3504485392',                   -- llave Bre-B (tipo celular)
    '3504485392',                   -- número Nequi (transferencia clásica)
    10                              -- minutos de reserva
  )
  returning id
)
insert into public.tickets (raffle_id, numero)
select rifa.id, gs.n
from rifa
cross join generate_series(0, 99) as gs(n);

-- Verificación: debe devolver 1 rifa y 100 tickets disponibles
select
  (select count(*) from public.raffles)  as rifas,
  (select count(*) from public.tickets)  as tickets,
  (select count(*) from public.tablero where estado = 'disponible') as disponibles;
