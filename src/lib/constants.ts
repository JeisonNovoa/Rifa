import type { CodigoErrorRpc } from './types';

/**
 * Constantes compartidas de la aplicación.
 * La configuración de la rifa (precio, fecha, llave Nequi, minutos de reserva)
 * NO vive aquí: vive en la base de datos (tabla raffles) para poder cambiarla
 * sin re-desplegar.
 */

/** Celular colombiano: 10 dígitos empezando por 3. Igual que la validación SQL. */
export const WHATSAPP_CO_REGEX = /^3\d{9}$/;

export const NOMBRE_MIN_CARACTERES = 2;
export const NOMBRE_MAX_CARACTERES = 80;

/** Tamaño máximo del comprobante (5 MB) y formatos aceptados */
export const COMPROBANTE_MAX_BYTES = 5 * 1024 * 1024;
export const COMPROBANTE_TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** Imagen del QR de Nequi (panel admin): máximo 2 MB */
export const QR_MAX_BYTES = 2 * 1024 * 1024;

/** Mensajes amigables para cada código de error de las RPC */
export const MENSAJES_ERROR: Record<CodigoErrorRpc, string> = {
  nombre_invalido: 'Escribe tu nombre completo (mínimo 2 letras).',
  whatsapp_invalido: 'El número de WhatsApp debe ser un celular colombiano de 10 dígitos (ej: 3001234567).',
  rifa_no_activa: 'La rifa no está activa en este momento.',
  numero_no_existe: 'Ese número no existe en esta rifa.',
  numero_ocupado: '¡Uy! Alguien acaba de tomar ese número. Escoge otro.',
  comprobante_invalido: 'No pudimos leer el comprobante. Intenta subirlo de nuevo.',
  ticket_no_existe: 'No encontramos tu reserva. Vuelve al tablero e intenta de nuevo.',
  token_invalido: 'Este enlace de reserva no es válido. Vuelve al tablero e intenta de nuevo.',
  estado_invalido: 'Este número ya cambió de estado. Refresca la página.',
  reserva_expirada: 'Tu reserva venció. El número quedó libre: vuelve a escogerlo si sigue disponible.',
};

/** Mensajes de validación del comprobante (cliente y servidor usan los mismos) */
export const MENSAJES_COMPROBANTE = {
  falta: 'Selecciona la imagen del comprobante.',
  muy_pesado: 'La imagen pesa más de 5 MB. Envía una más liviana.',
  formato: 'Formato no válido. Sube una imagen JPG, PNG o WebP.',
} as const;

/** Mensaje genérico para errores inesperados (nunca exponer detalles internos) */
export const MENSAJE_ERROR_GENERICO = 'Algo salió mal. Intenta de nuevo en un momento.';
