import type { TicketEstado } from '@/lib/types';

/** Textos y estilos compartidos del panel de admin. */

export const ETIQUETA_ESTADO: Record<TicketEstado, string> = {
  disponible: 'Libre',
  reservado: 'Reservado',
  en_revision: 'Por revisar',
  abonado: 'Abonado (debe)',
  vendido: 'Vendido',
};

export const ESTILO_INSIGNIA: Record<TicketEstado, string> = {
  disponible: 'border-noche-600 text-noche-300',
  reservado: 'border-dorado-600/60 text-dorado-400',
  en_revision: 'border-dorado-400 bg-dorado-400/10 text-dorado-300',
  abonado: 'border-crema-300/40 bg-crema-50/5 text-crema-100',
  vendido: 'border-rojo-500/50 bg-rojo-500/10 text-rojo-400',
};

export const DESCRIPCION_EVENTO: Record<string, string> = {
  reserva_creada: 'Reserva creada',
  comprobante_subido: 'Comprobante subido',
  pago_confirmado: '✅ Pago confirmado',
  pago_rechazado: 'Pago rechazado / número liberado',
  liberacion_por_expiracion: 'Reserva liberada por tiempo',
  venta_revertida: '↩️ Venta revertida',
  venta_manual: '🤝 Venta manual',
  abono_subido: 'Comprobante de abono subido',
  abono_confirmado: '✅ Abono confirmado',
  abono_rechazado: 'Abono rechazado',
  abono_revertido: '↩️ Abono revertido',
  rifa_cerrada: '🔒 Ventas cerradas',
  rifa_reabierta: '🔓 Ventas reabiertas',
  ganador_registrado: '🏆 Ganador registrado',
  ganador_quitado: 'Ganador retirado',
};
