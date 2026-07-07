import 'server-only';
import { crearClienteServidor } from '@/lib/supabase/server';

/**
 * Correos autorizados como administradores (variable ADMIN_EMAILS,
 * separados por comas). Aunque alguien lograra crear una cuenta en el
 * proyecto de Supabase, sin estar en esta lista no entra al panel.
 */
export function listaCorreosAdmin(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((correo) => correo.trim().toLowerCase())
    .filter(Boolean);
}

/** Correo del admin autenticado, o null si no hay sesión válida de admin. */
export async function obtenerAdminActual(): Promise<string | null> {
  try {
    const supabase = await crearClienteServidor();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const correo = user?.email?.toLowerCase();
    if (!correo || !listaCorreosAdmin().includes(correo)) return null;
    return correo;
  } catch (error: unknown) {
    console.error('obtenerAdminActual:', error);
    return null;
  }
}
