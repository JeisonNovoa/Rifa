import { createBrowserClient } from '@supabase/ssr';

/**
 * Cliente de Supabase para el NAVEGADOR (componentes cliente).
 * Usa la llave publishable (pública): solo puede leer las vistas públicas
 * (`tablero`, `rifa_publica`). No puede escribir nada.
 *
 * Nota: las variables NEXT_PUBLIC_* deben referenciarse de forma literal
 * (process.env.NOMBRE) para que Next.js las incruste en el bundle del cliente.
 * `createBrowserClient` reutiliza internamente una única instancia.
 */
export function crearClienteNavegador() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const llavePublica = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !llavePublica) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. ' +
        'Copia .env.example a .env.local y llena los valores.'
    );
  }

  return createBrowserClient(url, llavePublica);
}
