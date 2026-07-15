-- =============================================================================
-- 05 — FLYER v3 (jul 2026): nueva fecha de sorteo y planes del operador
--
--   · Sorteo: sábado 17 de octubre de 2026 (Lotería de Boyacá)
--   · Plazo de pago: 17 de octubre de 2026, 5:00 p.m. (regla: mismo día del
--     sorteo, boleta que no esté 100% paga no juega)
--   · Premio: Norcasia ahora es 2 días / 2 NOCHES; el plan del Güejar ahora
--     se llama "Güejar + Paraíso" e inicia en Mesetas, Meta.
--
-- CÓMO EJECUTARLO: pega TODO el archivo en el SQL Editor de Supabase → Run.
-- (Nota: este cambio ya se aplicó desde la app el 15-jul-2026; el archivo
--  queda como registro para poder reconstruir la base desde cero.)
-- =============================================================================

update public.raffles
set
  fecha_sorteo = date '2026-10-17',
  limite_pago  = timestamptz '2026-10-17 17:00:00-05',
  premio       = 'Viaje para 2 personas todo incluido + $500.000 de viáticos. '
                 'El ganador elige el destino: Norcasia, Caldas (2 días, 2 noches) '
                 'o Güejar + Paraíso en Mesetas, Meta (2 días, 1 noche).'
where nombre = 'Viaja por Colombia';

-- Verificación
select fecha_sorteo, limite_pago, premio from public.rifa_publica;
