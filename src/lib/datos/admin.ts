import 'server-only';
import { crearClienteAdmin } from '@/lib/supabase/admin';
import type { TicketEstado } from '@/lib/types';

/** Fila completa de un ticket, como la ve el admin (incluye datos personales). */
export interface TicketAdmin {
  id: string;
  numero: number;
  estado: TicketEstado;
  reservado_hasta: string | null;
  comprador_nombre: string | null;
  comprador_whatsapp: string | null;
  comprobante_url: string | null;
  token_gestion: string | null;
  total_abonado: number;
  actualizado_en: string;
  confirmado_en: string | null;
}

/** Un abono pendiente de revisión, con los datos de su boleta. */
export interface AbonoPendiente {
  abono_id: string;
  monto_declarado: number;
  creado_en: string;
  url_comprobante_firmada: string | null;
  ticket_id: string;
  numero: number;
  comprador_nombre: string | null;
  comprador_whatsapp: string | null;
  total_previo: number;
}

export interface ResumenAdmin {
  libres: number;
  reservados: number;
  en_revision: number;
  abonados: number;
  vendidos: number;
  /** Plata CONFIRMADA en caja (suma de todos los abonos confirmados) */
  recaudo: number;
  /** Lo que deben los abonados para completar sus boletas */
  por_cobrar: number;
  recaudo_posible: number;
}

export interface EventoAuditoria {
  id: number;
  accion: string;
  actor: string;
  creado_en: string;
  numero: number | null;
}

export async function obtenerTicketsAdmin(): Promise<TicketAdmin[]> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin
    .from('tickets')
    .select(
      'id, numero, estado, reservado_hasta, comprador_nombre, comprador_whatsapp, comprobante_url, token_gestion, total_abonado, actualizado_en, confirmado_en'
    )
    .order('numero', { ascending: true });
  if (error) {
    throw new Error(`No se pudieron cargar los números: ${error.message}`);
  }
  return (data ?? []) as TicketAdmin[];
}

/** ¿La reserva sigue vigente? (los expirados cuentan como libres) */
export function reservaVigente(ticket: TicketAdmin, ahora = Date.now()): boolean {
  return (
    ticket.estado === 'reservado' &&
    ticket.reservado_hasta !== null &&
    new Date(ticket.reservado_hasta).getTime() > ahora
  );
}

export function resumirTickets(
  tickets: TicketAdmin[],
  precioPorNumero: number
): ResumenAdmin {
  const ahora = Date.now();
  const vendidos = tickets.filter((t) => t.estado === 'vendido').length;
  const enRevision = tickets.filter((t) => t.estado === 'en_revision').length;
  const abonados = tickets.filter((t) => t.estado === 'abonado').length;
  const reservados = tickets.filter((t) => reservaVigente(t, ahora)).length;
  const recaudo = tickets.reduce((suma, t) => suma + (t.total_abonado ?? 0), 0);
  const porCobrar = tickets
    .filter((t) => t.estado === 'abonado')
    .reduce((suma, t) => suma + (precioPorNumero - (t.total_abonado ?? 0)), 0);
  return {
    vendidos,
    en_revision: enRevision,
    abonados,
    reservados,
    libres: tickets.length - vendidos - enRevision - abonados - reservados,
    recaudo,
    por_cobrar: porCobrar,
    recaudo_posible: tickets.length * precioPorNumero,
  };
}

/** Abonos pendientes de revisión con su comprobante firmado. */
export async function obtenerAbonosPendientes(): Promise<AbonoPendiente[]> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin
    .from('abonos')
    .select(
      'id, monto, comprobante_url, creado_en, tickets(id, numero, comprador_nombre, comprador_whatsapp, total_abonado)'
    )
    .eq('estado', 'en_revision')
    .order('creado_en', { ascending: true });
  if (error) {
    console.error('No se pudieron cargar los abonos pendientes:', error.message);
    return [];
  }

  const filas = (data ?? []) as unknown as Array<{
    id: string;
    monto: number;
    comprobante_url: string | null;
    creado_en: string;
    tickets: {
      id: string;
      numero: number;
      comprador_nombre: string | null;
      comprador_whatsapp: string | null;
      total_abonado: number | null;
    } | null;
  }>;

  const rutas = filas
    .map((f) => f.comprobante_url)
    .filter((ruta): ruta is string => ruta !== null);
  const firmadas = new Map<string, string>();
  if (rutas.length > 0) {
    const { data: firmas, error: errorFirmas } = await admin.storage
      .from('comprobantes')
      .createSignedUrls(rutas, 3600);
    if (errorFirmas) {
      console.error('No se pudieron firmar los comprobantes:', errorFirmas.message);
    }
    firmas?.forEach((firma) => {
      if (firma.signedUrl && firma.path) firmadas.set(firma.path, firma.signedUrl);
    });
  }

  return filas
    .filter((f) => f.tickets !== null)
    .map((f) => ({
      abono_id: f.id,
      monto_declarado: f.monto,
      creado_en: f.creado_en,
      url_comprobante_firmada: f.comprobante_url
        ? (firmadas.get(f.comprobante_url) ?? null)
        : null,
      ticket_id: f.tickets!.id,
      numero: f.tickets!.numero,
      comprador_nombre: f.tickets!.comprador_nombre,
      comprador_whatsapp: f.tickets!.comprador_whatsapp,
      total_previo: f.tickets!.total_abonado ?? 0,
    }));
}

export async function obtenerEventosRecientes(
  limite = 12
): Promise<EventoAuditoria[]> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin
    .from('audit_log')
    .select('id, accion, actor, creado_en, tickets(numero)')
    .order('creado_en', { ascending: false })
    .limit(limite);
  if (error) {
    console.error('No se pudo cargar la auditoría:', error.message);
    return [];
  }
  return (data ?? []).map((evento) => ({
    id: evento.id as number,
    accion: evento.accion as string,
    actor: evento.actor as string,
    creado_en: evento.creado_en as string,
    numero:
      (evento.tickets as unknown as { numero: number } | null)?.numero ?? null,
  }));
}
