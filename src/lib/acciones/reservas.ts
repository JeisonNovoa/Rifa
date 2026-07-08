'use server';

import { redirect } from 'next/navigation';
import {
  COMPROBANTE_MAX_BYTES,
  COMPROBANTE_TIPOS_PERMITIDOS,
  MENSAJE_ERROR_GENERICO,
  MENSAJES_COMPROBANTE,
  MENSAJES_ERROR,
} from '@/lib/constants';
import { crearClienteAdmin } from '@/lib/supabase/admin';
import type {
  CodigoErrorRpc,
  ResultadoReserva,
  ResultadoTransicion,
} from '@/lib/types';
import {
  esquemaComprobante,
  esquemaReserva,
  normalizarWhatsapp,
} from '@/lib/validacion';

/** Estado que devuelven las acciones a los formularios (useActionState). */
export interface EstadoAccion {
  error?: string;
}

function mensajeDeCodigo(codigo: string | undefined): string {
  if (codigo && codigo in MENSAJES_ERROR) {
    return MENSAJES_ERROR[codigo as CodigoErrorRpc];
  }
  return MENSAJE_ERROR_GENERICO;
}

/**
 * Reserva un número: valida, llama la RPC atómica `reservar_numero`
 * y redirige a la boleta digital del comprador (URL con su token secreto).
 */
export async function accionReservarNumero(
  _estadoPrevio: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  const parseo = esquemaReserva.safeParse({
    raffleId: formData.get('raffleId'),
    numero: formData.get('numero'),
    nombre: formData.get('nombre'),
    whatsapp: normalizarWhatsapp(String(formData.get('whatsapp') ?? '')),
  });

  if (!parseo.success) {
    const campo = parseo.error.issues[0]?.path[0];
    if (campo === 'whatsapp') return { error: MENSAJES_ERROR.whatsapp_invalido };
    if (campo === 'nombre') return { error: MENSAJES_ERROR.nombre_invalido };
    return { error: MENSAJE_ERROR_GENERICO };
  }

  let destino: string;
  try {
    const admin = crearClienteAdmin();
    const { data, error } = await admin.rpc('reservar_numero', {
      p_raffle_id: parseo.data.raffleId,
      p_numero: parseo.data.numero,
      p_nombre: parseo.data.nombre,
      p_whatsapp: parseo.data.whatsapp,
    });

    if (error) {
      console.error('RPC reservar_numero falló:', error.message);
      return { error: MENSAJE_ERROR_GENERICO };
    }

    const resultado = data as ResultadoReserva;
    if (!resultado.ok || !resultado.ticket_id || !resultado.token) {
      return { error: mensajeDeCodigo(resultado.error) };
    }

    destino = `/boleta/${resultado.ticket_id}?t=${resultado.token}`;
  } catch (error: unknown) {
    console.error('accionReservarNumero:', error);
    return { error: MENSAJE_ERROR_GENERICO };
  }

  // redirect lanza internamente: debe ir FUERA del try/catch.
  redirect(destino);
}

const EXTENSION_POR_TIPO: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Sube el comprobante al bucket privado y marca el ticket como "en revisión".
 * El comprador se autentica con el token secreto de su reserva.
 */
export async function accionSubirComprobante(
  _estadoPrevio: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  const parseo = esquemaComprobante.safeParse({
    ticketId: formData.get('ticketId'),
    token: formData.get('token'),
    monto: formData.get('monto'),
  });
  if (!parseo.success) {
    const campo = parseo.error.issues[0]?.path[0];
    if (campo === 'monto') return { error: MENSAJES_ERROR.monto_invalido };
    return { error: MENSAJES_ERROR.token_invalido };
  }
  const { ticketId, token, monto } = parseo.data;

  const archivo = formData.get('archivo');
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: MENSAJES_COMPROBANTE.falta };
  }
  if (archivo.size > COMPROBANTE_MAX_BYTES) {
    return { error: MENSAJES_COMPROBANTE.muy_pesado };
  }
  if (!(COMPROBANTE_TIPOS_PERMITIDOS as readonly string[]).includes(archivo.type)) {
    return { error: MENSAJES_COMPROBANTE.formato };
  }

  const ruta = `${ticketId}/${crypto.randomUUID()}.${EXTENSION_POR_TIPO[archivo.type]}`;

  try {
    const admin = crearClienteAdmin();

    const { error: errorSubida } = await admin.storage
      .from('comprobantes')
      .upload(ruta, await archivo.arrayBuffer(), { contentType: archivo.type });
    if (errorSubida) {
      console.error('Subida de comprobante falló:', errorSubida.message);
      return { error: MENSAJE_ERROR_GENERICO };
    }

    const { data, error } = await admin.rpc('subir_comprobante', {
      p_ticket_id: ticketId,
      p_token: token,
      p_comprobante_url: ruta,
      p_monto: monto,
    });

    if (error || !(data as ResultadoTransicion).ok) {
      // No dejamos archivos huérfanos si la transición falló.
      await admin.storage.from('comprobantes').remove([ruta]);
      if (error) {
        console.error('RPC subir_comprobante falló:', error.message);
        return { error: MENSAJE_ERROR_GENERICO };
      }
      return { error: mensajeDeCodigo((data as ResultadoTransicion).error) };
    }
  } catch (error: unknown) {
    console.error('accionSubirComprobante:', error);
    return { error: MENSAJE_ERROR_GENERICO };
  }

  redirect(`/boleta/${ticketId}?t=${token}`);
}
