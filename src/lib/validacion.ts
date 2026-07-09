import { z } from 'zod';
import {
  NOMBRE_MAX_CARACTERES,
  NOMBRE_MIN_CARACTERES,
  WHATSAPP_CO_REGEX,
} from './constants';

/** UUID v4 (formato de ids y tokens de Supabase) */
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Deja solo dígitos y quita el prefijo de país 57 si viene incluido.
 * "+57 300 123 4567" → "3001234567"
 */
export function normalizarWhatsapp(entrada: string): string {
  const digitos = entrada.replace(/\D/g, '');
  return digitos.length === 12 && digitos.startsWith('57')
    ? digitos.slice(2)
    : digitos;
}

export const esquemaReserva = z.object({
  raffleId: z.string().regex(UUID_REGEX),
  numero: z.coerce.number().int().min(0).max(99),
  nombre: z.string().trim().min(NOMBRE_MIN_CARACTERES).max(NOMBRE_MAX_CARACTERES),
  whatsapp: z.string().regex(WHATSAPP_CO_REGEX),
});

export const esquemaComprobante = z.object({
  ticketId: z.string().regex(UUID_REGEX),
  token: z.string().regex(UUID_REGEX),
  monto: z.coerce.number().int().min(1000),
});

/** Entradas para verificar boletas guardadas en un dispositivo (máx. 20, igual que el localStorage). */
export const esquemaVerificacionBoletas = z
  .array(
    z.object({
      id: z.string().regex(UUID_REGEX),
      token: z.string().regex(UUID_REGEX),
    })
  )
  .min(1)
  .max(20);

export const esquemaConfiguracion = z.object({
  raffleId: z.string().regex(UUID_REGEX),
  llave: z.string().trim().max(60),
  numeroNequi: z.string().trim().max(20),
  minutos: z.coerce.number().int().min(5).max(120),
  abonoMinimo: z.coerce.number().int().min(1000).max(60000),
});
