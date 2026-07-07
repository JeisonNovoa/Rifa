import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Cliente ADMINISTRATIVO de Supabase (service_role).
 *
 * ⚠️ SOLO SERVIDOR. El import de 'server-only' hace que el build FALLE
 * si alguien intenta importar este archivo desde un componente cliente.
 *
 * Usa la llave "secret" (sb_secret_...), equivalente moderno de service_role.
 * Es el único cliente autorizado para llamar las RPCs de negocio
 * (reservar_numero, subir_comprobante, confirmar_pago, etc.) y para
 * subir/leer comprobantes del bucket privado.
 */
export function crearClienteAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const llaveSecreta = process.env.SUPABASE_SECRET_KEY;

  if (!url) {
    throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL. Copia .env.example a .env.local.');
  }
  if (!llaveSecreta) {
    throw new Error(
      'Falta SUPABASE_SECRET_KEY (solo servidor). ' +
        'En local va en .env.local; en Fly se configura con `fly secrets set`.'
    );
  }

  return createClient(url, llaveSecreta, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
