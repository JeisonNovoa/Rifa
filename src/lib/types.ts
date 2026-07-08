/**
 * Tipos del dominio de la rifa.
 * Espejan el esquema SQL (supabase/01_esquema.sql) — si cambias uno, cambia el otro.
 * Convención: snake_case en campos que vienen de la base de datos.
 */

export type TicketEstado =
  | 'disponible'
  | 'reservado'
  | 'en_revision'
  | 'abonado' // apartado con abonos, sin completar el pago
  | 'vendido';

export type RifaEstado = 'activa' | 'cerrada';

/** Fila de la vista pública `rifa_publica` */
export interface RifaPublica {
  id: string;
  nombre: string;
  premio: string | null;
  precio_por_numero: number;
  total_numeros: number;
  estado: RifaEstado;
  fecha_sorteo: string | null; // ISO date (YYYY-MM-DD)
  numero_ganador: number | null;
  nequi_llave: string | null;
  nequi_numero: string | null;
  nequi_qr_url: string | null;
  minutos_reserva: number;
  /** Monto mínimo del primer abono para apartar (regla del flyer: $20.000) */
  abono_minimo: number;
  /** Fecha y hora límite para completar el pago (ISO timestamp) */
  limite_pago: string | null;
}

/** Un pago (o intento de pago) sobre una boleta */
export interface Abono {
  id: string;
  monto: number;
  estado: 'en_revision' | 'confirmado' | 'rechazado';
  creado_en: string;
  resuelto_en: string | null;
}

/** Fila de la vista pública `tablero` (una casilla del 00-99) */
export interface CasillaTablero {
  raffle_id: string;
  numero: number;
  estado: TicketEstado;
  reservado_hasta: string | null; // ISO timestamp; solo presente si está reservado vigente
}

/** Códigos de error que devuelven las funciones RPC (ver 01_esquema.sql) */
export type CodigoErrorRpc =
  | 'nombre_invalido'
  | 'whatsapp_invalido'
  | 'rifa_no_activa'
  | 'numero_no_existe'
  | 'numero_ocupado'
  | 'comprobante_invalido'
  | 'ticket_no_existe'
  | 'token_invalido'
  | 'estado_invalido'
  | 'reserva_expirada'
  | 'monto_invalido'
  | 'monto_menor_al_minimo'
  | 'abono_no_existe';

/** Respuesta de la RPC `reservar_numero` */
export interface ResultadoReserva {
  ok: boolean;
  error?: CodigoErrorRpc;
  ticket_id?: string;
  token?: string;
  numero?: number;
  reservado_hasta?: string;
}

/** Respuesta de las RPC `subir_comprobante`, `confirmar_pago` y `rechazar_pago` */
export interface ResultadoTransicion {
  ok: boolean;
  error?: CodigoErrorRpc;
  ticket_id?: string;
  estado?: TicketEstado;
}
