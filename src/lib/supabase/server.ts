import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * Cliente de Supabase para SERVER COMPONENTS y SERVER ACTIONS,
 * con la llave publishable + cookies (necesario para la sesión del admin en Fase 3).
 * Para operaciones privilegiadas (RPCs de negocio) usa `admin.ts`, no este.
 */
export async function crearClienteServidor() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const llavePublica = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !llavePublica) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. ' +
        'Copia .env.example a .env.local y llena los valores.'
    );
  }

  const almacenCookies = await cookies();

  return createServerClient(url, llavePublica, {
    cookies: {
      getAll() {
        return almacenCookies.getAll();
      },
      setAll(cookiesPorEscribir) {
        try {
          cookiesPorEscribir.forEach(({ name, value, options }) =>
            almacenCookies.set(name, value, options)
          );
        } catch {
          // Llamado desde un Server Component (no puede escribir cookies).
          // Se ignora: el refresco de sesión se maneja en Server Actions.
        }
      },
    },
  });
}
