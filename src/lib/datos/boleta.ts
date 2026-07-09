import 'server-only';
import { conReintento } from '@/lib/reintento';
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

interface FilaTicket {
  id: string;
  numero: number;
  estado: string;
  reservado_hasta: string | null;
  comprador_nombre: string | null;
  comprobante_url: string | null;
  token_gestion: string | null;
  total_abonado: number | null;
}

/**
 * Devuelve la boleta solo si el token coincide con el de la reserva.
 *
 * - null      → la boleta NO existe o el token no coincide (inválida de verdad).
 * - throw     → falla de conexión tras reintentos: el que llama debe mostrar
 *               "error temporal, reintenta" y NUNCA "boleta no existe".
 *               (Antes se confundían ambos casos y asustaba a los compradores.)
 */
export async function obtenerBoletaPorToken(
  ticketId: string,
  token: string
): Promise<BoletaComprador | null> {
  const admin = crearClienteAdmin();

  // Consulta principal con reintento: un parpadeo de red no puede
  // convertirse en un falso "tu boleta no existe".
  const data = await conReintento(async () => {
    const { data: fila, error } = await admin
      .from('tickets')
      .select(
        'id, numero, estado, reservado_hasta, comprador_nombre, comprobante_url, token_gestion, total_abonado'
      )
      .eq('id', ticketId)
      .maybeSingle();
    if (error) {
      throw new Error(`No se pudo consultar la boleta: ${error.message}`);
    }
    return fila as FilaTicket | null;
  });

  // Ahora sí: inexistente o token equivocado → inválida de verdad.
  if (!data) return null;
  if (!data.token_gestion || data.token_gestion !== token) return null;

  // Lo secundario es tolerante a fallas: nunca bloquea la boleta.
  let urlComprobante: string | null = null;
  if (data.comprobante_url) {
    try {
      const { data: firmada } = await admin.storage
        .from('comprobantes')
        .createSignedUrl(data.comprobante_url, 60 * 10);
      urlComprobante = firmada?.signedUrl ?? null;
    } catch (error: unknown) {
      console.error('No se pudo firmar el comprobante:', error);
    }
  }

  let confirmados: Abono[] = [];
  let pendiente: Abono | null = null;
  try {
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
  } catch (error: unknown) {
    console.error('No se pudieron cargar los abonos:', error);
  }

  return {
    ticket_id: data.id,
    numero: data.numero,
    estado: data.estado as TicketEstado,
    reservado_hasta: data.reservado_hasta,
    comprador_nombre: data.comprador_nombre,
    total_abonado: data.total_abonado ?? 0,
    tiene_comprobante: Boolean(data.comprobante_url),
    url_comprobante: urlComprobante,
    abonos_confirmados: confirmados,
    abono_pendiente: pendiente,
  };
}
