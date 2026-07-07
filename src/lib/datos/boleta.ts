import 'server-only';
import { crearClienteAdmin } from '@/lib/supabase/admin';
import type { TicketEstado } from '@/lib/types';

/** Datos de la boleta que ve SU comprador (autenticado con su token). */
export interface BoletaComprador {
  ticket_id: string;
  numero: number;
  estado: TicketEstado;
  reservado_hasta: string | null;
  comprador_nombre: string | null;
  tiene_comprobante: boolean;
  /** URL firmada temporal para previsualizar su propio comprobante */
  url_comprobante: string | null;
}

/**
 * Devuelve la boleta solo si el token coincide con el de la reserva.
 * Si la reserva expiró y fue liberada, el token se borró → devuelve null.
 */
export async function obtenerBoletaPorToken(
  ticketId: string,
  token: string
): Promise<BoletaComprador | null> {
  try {
    const admin = crearClienteAdmin();
    const { data, error } = await admin
      .from('tickets')
      .select(
        'id, numero, estado, reservado_hasta, comprador_nombre, comprobante_url, token_gestion'
      )
      .eq('id', ticketId)
      .single();

    if (error || !data) return null;
    if (!data.token_gestion || data.token_gestion !== token) return null;

    let urlComprobante: string | null = null;
    if (data.comprobante_url) {
      const { data: firmada } = await admin.storage
        .from('comprobantes')
        .createSignedUrl(data.comprobante_url, 60 * 10);
      urlComprobante = firmada?.signedUrl ?? null;
    }

    return {
      ticket_id: data.id,
      numero: data.numero,
      estado: data.estado as TicketEstado,
      reservado_hasta: data.reservado_hasta,
      comprador_nombre: data.comprador_nombre,
      tiene_comprobante: Boolean(data.comprobante_url),
      url_comprobante: urlComprobante,
    };
  } catch (error: unknown) {
    console.error('obtenerBoletaPorToken:', error);
    return null;
  }
}
