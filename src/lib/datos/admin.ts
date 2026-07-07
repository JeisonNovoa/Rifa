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
  actualizado_en: string;
  confirmado_en: string | null;
}

export interface PendienteRevision extends TicketAdmin {
  url_comprobante_firmada: string | null;
}

export interface ResumenAdmin {
  libres: number;
  reservados: number;
  en_revision: number;
  vendidos: number;
  recaudo: number;
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
      'id, numero, estado, reservado_hasta, comprador_nombre, comprador_whatsapp, comprobante_url, token_gestion, actualizado_en, confirmado_en'
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
  const reservados = tickets.filter((t) => reservaVigente(t, ahora)).length;
  return {
    vendidos,
    en_revision: enRevision,
    reservados,
    libres: tickets.length - vendidos - enRevision - reservados,
    recaudo: vendidos * precioPorNumero,
    recaudo_posible: tickets.length * precioPorNumero,
  };
}

/** Agrega URLs firmadas temporales para previsualizar los comprobantes. */
export async function firmarComprobantes(
  pendientes: TicketAdmin[]
): Promise<PendienteRevision[]> {
  const admin = crearClienteAdmin();
  const rutas = pendientes
    .map((p) => p.comprobante_url)
    .filter((ruta): ruta is string => ruta !== null);

  const firmadas = new Map<string, string>();
  if (rutas.length > 0) {
    const { data, error } = await admin.storage
      .from('comprobantes')
      .createSignedUrls(rutas, 3600);
    if (error) {
      console.error('No se pudieron firmar los comprobantes:', error.message);
    }
    data?.forEach((firma) => {
      if (firma.signedUrl && firma.path) firmadas.set(firma.path, firma.signedUrl);
    });
  }

  return pendientes.map((p) => ({
    ...p,
    url_comprobante_firmada: p.comprobante_url
      ? (firmadas.get(p.comprobante_url) ?? null)
      : null,
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
