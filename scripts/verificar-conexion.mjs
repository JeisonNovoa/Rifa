/**
 * Script de verificación de conexión a Supabase.
 * Comprueba que las 3 llaves de .env.local funcionan y que el esquema
 * (01_esquema.sql + 02_seed.sql) quedó bien aplicado.
 *
 * Uso:  node --env-file=.env.local scripts/verificar-conexion.mjs
 *
 * NO imprime ninguna llave; solo el resultado de cada chequeo.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publica = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secreta = process.env.SUPABASE_SECRET_KEY;

let fallos = 0;
const ok = (m) => console.log(`  ✅ ${m}`);
const err = (m) => { console.log(`  ❌ ${m}`); fallos++; };

console.log('\n── Verificando configuración ──');
url ? ok('NEXT_PUBLIC_SUPABASE_URL presente') : err('falta NEXT_PUBLIC_SUPABASE_URL');
publica ? ok('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY presente') : err('falta la llave publishable');
secreta ? ok('SUPABASE_SECRET_KEY presente') : err('falta la llave secret');
if (fallos > 0) { console.log('\nArregla lo anterior en .env.local y vuelve a correr.\n'); process.exit(1); }

// --- Cliente PÚBLICO: debe leer las vistas, pero NO las tablas ---
console.log('\n── Cliente público (navegador) ──');
const anon = createClient(url, publica, { auth: { persistSession: false } });

const { data: rifa, error: eRifa } = await anon
  .from('rifa_publica')
  .select('nombre, precio_por_numero, total_numeros, fecha_sorteo, minutos_reserva')
  .single();
if (eRifa) err(`no pudo leer rifa_publica: ${eRifa.message}`);
else ok(`lee rifa_publica: "${rifa.nombre}", $${rifa.precio_por_numero.toLocaleString('es-CO')}, sorteo ${rifa.fecha_sorteo}, reserva ${rifa.minutos_reserva} min`);

const { count, error: eTab } = await anon
  .from('tablero')
  .select('numero', { count: 'exact', head: true });
if (eTab) err(`no pudo leer tablero: ${eTab.message}`);
else count === 100 ? ok(`tablero tiene ${count} números`) : err(`tablero tiene ${count} números (esperados 100)`);

// Seguridad: el cliente público NO debe poder leer la tabla cruda `tickets`
const { error: eTickets } = await anon.from('tickets').select('comprador_whatsapp').limit(1);
if (eTickets) ok('bloqueado el acceso público a la tabla `tickets` (datos personales protegidos)');
else err('PELIGRO: el cliente público pudo leer la tabla `tickets` — revisa RLS');

// --- Cliente SECRETO: debe ejecutar las RPCs y leer todo ---
console.log('\n── Cliente secreto (servidor) ──');
const admin = createClient(url, secreta, { auth: { persistSession: false } });

const { data: liberados, error: eLib } = await admin.rpc('liberar_expirados');
if (eLib) err(`no pudo ejecutar liberar_expirados(): ${eLib.message}`);
else ok(`ejecuta la RPC liberar_expirados() → ${liberados} liberados (0 esperado ahora)`);

const { count: cAdmin, error: eAdminTickets } = await admin
  .from('tickets')
  .select('id', { count: 'exact', head: true });
if (eAdminTickets) err(`el cliente secreto no pudo leer tickets: ${eAdminTickets.message}`);
else ok(`el cliente secreto ve la tabla completa (${cAdmin} tickets)`);

console.log(`\n${fallos === 0 ? '✅ TODO CONECTADO — listo para la Fase 1' : `❌ ${fallos} problema(s) — revisa arriba`}\n`);
process.exit(fallos === 0 ? 0 : 1);
