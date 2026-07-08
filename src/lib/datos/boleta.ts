import 'server-only';
import { crearClienteAdmin } from '@/lib/supabase/admin';
import type { Abono, TicketEstado } from '@/lib/types';

/** Datos de la boleta que ve SU comprador (autenticado con su token). */
export interface BoletaComprador {
  ticket_id: string;
  numero: number;
  estado: TicketEstado;
  reservado_hasta: string | null;
  comprador_nombre: string | null;
  /** Suma de abonos confirmados */
  total_abonado: number;
  tiene_comprobante: boolean;
  /** URL firmada temporal para previsualizar su propio comprobante */
  url_comprobante: string | null;
  abonos_confirmados: Abono[];
  abono_pendiente: Abono | null;
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
        'id, numero, estado, reservado_hasta, comprador_nombre, comprobante_url, token_gestion, total_abonado'
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

    // Historial de abonos (tolerante: si la tabla aún no existe, listas vacías)
    let confirmados: Abono[] = [];
    let pendiente: Abono | null = null;
    const { data: abonos, error: errorAbonos } = await admin
      .from('abonos')
      .select('id, monto, estado, creado_en, resuelto_en')
      .eq('ticket_id', ticketId)
      .order('creado_en', { ascending: true });
    if (errorAbonos) {
      console.error('No se pudieron cargar los abonos:', errorAbonos.message);
    } else {
      const lista = (abonos ?? []) as Abono[];
      confirmados = lista.filter((a) => a.estado === 'confirmado');
      pendiente = lista.find((a) => a.estado === 'en_revision') ?? null;
    }

    return {
      ticket_id: data.id,
      numero: data.numero,
      estado: data.estado as TicketEstado,
      reservado_hasta: data.reservado_hasta,
      comprador_nombre: data.comprador_nombre,
      total_abonado: (data.total_abonado as number | null) ?? 0,
      tiene_comprobante: Boolean(data.comprobante_url),
      url_comprobante: urlComprobante,
      abonos_confirmados: confirmados,
      abono_pendiente: pendiente,
    };
  } catch (error: unknown) {
    console.error('obtenerBoletaPorToken:', error);
    return null;
  }
}
