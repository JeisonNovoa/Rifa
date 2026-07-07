import 'server-only';
import { crearClienteAdmin } from '@/lib/supabase/admin';

/** Información del número ganador (para la página pública y el panel). */
export interface InfoGanador {
  numero: number;
  vendido: boolean;
  /** Solo presente si el número fue vendido */
  nombre: string | null;
  whatsapp: string | null;
}

export async function obtenerInfoGanador(
  numeroGanador: number | null
): Promise<InfoGanador | null> {
  if (numeroGanador === null) return null;

  try {
    const admin = crearClienteAdmin();
    const { data, error } = await admin
      .from('tickets')
      .select('estado, comprador_nombre, comprador_whatsapp')
      .eq('numero', numeroGanador)
      .single();

    if (error || !data) {
      console.error('obtenerInfoGanador:', error?.message);
      return { numero: numeroGanador, vendido: false, nombre: null, whatsapp: null };
    }

    const vendido = data.estado === 'vendido';
    return {
      numero: numeroGanador,
      vendido,
      nombre: vendido ? data.comprador_nombre : null,
      whatsapp: vendido ? data.comprador_whatsapp : null,
    };
  } catch (error: unknown) {
    console.error('obtenerInfoGanador:', error);
    return { numero: numeroGanador, vendido: false, nombre: null, whatsapp: null };
  }
}
