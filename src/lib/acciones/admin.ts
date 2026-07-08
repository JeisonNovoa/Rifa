'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { listaCorreosAdmin, obtenerAdminActual } from '@/lib/auth-admin';
import {
  COMPROBANTE_TIPOS_PERMITIDOS,
  MENSAJE_ERROR_GENERICO,
  QR_MAX_BYTES,
} from '@/lib/constants';
import { dosDigitos, formatearPesos } from '@/lib/formato';
import { crearClienteAdmin } from '@/lib/supabase/admin';
import { crearClienteServidor } from '@/lib/supabase/server';
import type { ResultadoTransicion } from '@/lib/types';
import {
  UUID_REGEX,
  esquemaConfiguracion,
  esquemaReserva,
  normalizarWhatsapp,
} from '@/lib/validacion';

/** Estado que devuelven las acciones del panel (useActionState). */
export interface EstadoAdmin {
  error?: string;
  exito?: string;
  /** Enlace de boleta para compartir (lo devuelve la venta manual). */
  enlaceBoleta?: string;
}

/** Mensajes claros para el admin según el código de la RPC. */
const MENSAJES_ADMIN: Record<string, string> = {
  estado_invalido: 'El número ya cambió de estado. Refresca la página.',
  ticket_no_existe: 'No se encontró ese número. Refresca la página.',
  numero_ocupado:
    'Ese número no está libre (reservado, en revisión o vendido). Libéralo primero si corresponde.',
  numero_no_existe: 'Ese número no existe en la rifa.',
  rifa_no_activa: 'La rifa no está activa.',
  nombre_invalido: 'El nombre debe tener entre 2 y 80 caracteres.',
  whatsapp_invalido: 'El WhatsApp debe ser un celular de 10 dígitos (3XXXXXXXXX).',
  monto_invalido:
    'Monto inválido: no puede superar lo que falta para completar la boleta.',
  abono_no_existe: 'No se encontró ese abono. Refresca la página.',
};

function mensajeAdmin(codigo: string | undefined): string {
  return (codigo && MENSAJES_ADMIN[codigo]) || MENSAJE_ERROR_GENERICO;
}

/** Corta la ejecución si no hay un admin autenticado. */
async function exigirAdmin() {
  const correo = await obtenerAdminActual();
  if (!correo) redirect('/admin/login');
  return crearClienteAdmin();
}

/** Refresca panel y página pública (el tablero cambia con cada acción). */
function refrescarTodo() {
  revalidatePath('/', 'layout');
}

async function urlBase(): Promise<string> {
  const encabezados = await headers();
  const host = encabezados.get('host') ?? 'localhost:3000';
  const protocolo =
    encabezados.get('x-forwarded-proto') ??
    (host.startsWith('localhost') ? 'http' : 'https');
  return `${protocolo}://${host}`;
}

/* ------------------------------------------------------------------ */
/* Sesión                                                              */
/* ------------------------------------------------------------------ */

export async function accionIniciarSesion(
  _prev: EstadoAdmin,
  formData: FormData
): Promise<EstadoAdmin> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) {
    return { error: 'Escribe tu correo y contraseña.' };
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: 'Correo o contraseña incorrectos.' };
  }
  if (!listaCorreosAdmin().includes(email)) {
    await supabase.auth.signOut();
    return { error: 'Este usuario no tiene permisos de administrador.' };
  }

  redirect('/admin');
}

export async function accionCerrarSesion(): Promise<void> {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect('/admin/login');
}

/* ------------------------------------------------------------------ */
/* Gestión de pagos                                                    */
/* ------------------------------------------------------------------ */

interface ResultadoAbono {
  ok: boolean;
  error?: string;
  estado?: string;
  total?: number;
  numero?: number;
  liberado?: boolean;
}

/** Confirma un abono con el monto REAL que llegó (el admin puede ajustarlo). */
export async function accionConfirmarAbono(
  _prev: EstadoAdmin,
  formData: FormData
): Promise<EstadoAdmin> {
  const abonoId = String(formData.get('abonoId') ?? '');
  const monto = Number.parseInt(String(formData.get('monto') ?? ''), 10);
  if (!UUID_REGEX.test(abonoId)) return { error: MENSAJE_ERROR_GENERICO };
  if (Number.isNaN(monto) || monto < 1000) {
    return { error: 'El monto debe ser de mínimo $1.000.' };
  }

  const admin = await exigirAdmin();
  try {
    const { data, error } = await admin.rpc('confirmar_abono', {
      p_abono_id: abonoId,
      p_monto: monto,
    });
    if (error) {
      console.error('confirmar_abono:', error.message);
      return { error: MENSAJE_ERROR_GENERICO };
    }
    const resultado = data as ResultadoAbono;
    if (!resultado.ok) return { error: mensajeAdmin(resultado.error) };

    refrescarTodo();
    const numero = dosDigitos(resultado.numero ?? 0);
    return {
      exito:
        resultado.estado === 'vendido'
          ? `✅ N.º ${numero} quedó VENDIDO (100% pago).`
          : `✅ Abono confirmado: N.º ${numero} apartado con ${formatearPesos(resultado.total ?? monto)}.`,
    };
  } catch (error: unknown) {
    console.error('accionConfirmarAbono:', error);
    return { error: MENSAJE_ERROR_GENERICO };
  }
}

/** Rechaza un abono. Si era el primer pago, el número se libera. */
export async function accionRechazarAbono(
  _prev: EstadoAdmin,
  formData: FormData
): Promise<EstadoAdmin> {
  const abonoId = String(formData.get('abonoId') ?? '');
  const motivo = String(formData.get('motivo') ?? '').trim() || null;
  if (!UUID_REGEX.test(abonoId)) return { error: MENSAJE_ERROR_GENERICO };

  const admin = await exigirAdmin();
  try {
    // Ruta del archivo ANTES de rechazar (el rechazo puede borrar la fila)
    const { data: abono } = await admin
      .from('abonos')
      .select('comprobante_url')
      .eq('id', abonoId)
      .single();

    const { data, error } = await admin.rpc('rechazar_abono', {
      p_abono_id: abonoId,
      p_motivo: motivo,
    });
    if (error) {
      console.error('rechazar_abono:', error.message);
      return { error: MENSAJE_ERROR_GENERICO };
    }
    const resultado = data as ResultadoAbono;
    if (!resultado.ok) return { error: mensajeAdmin(resultado.error) };

    if (abono?.comprobante_url) {
      const { error: errorBorrado } = await admin.storage
        .from('comprobantes')
        .remove([abono.comprobante_url]);
      if (errorBorrado) {
        console.error('No se pudo borrar el comprobante:', errorBorrado.message);
      }
    }

    refrescarTodo();
    return {
      exito: resultado.liberado
        ? 'Abono rechazado: el número volvió a estar disponible.'
        : 'Abono rechazado: el número sigue apartado con lo ya abonado.',
    };
  } catch (error: unknown) {
    console.error('accionRechazarAbono:', error);
    return { error: MENSAJE_ERROR_GENERICO };
  }
}

/** Registra un abono en efectivo/WhatsApp sobre un número ya apartado. */
export async function accionAbonoManual(
  _prev: EstadoAdmin,
  formData: FormData
): Promise<EstadoAdmin> {
  const ticketId = String(formData.get('ticketId') ?? '');
  const monto = Number.parseInt(String(formData.get('monto') ?? ''), 10);
  if (!UUID_REGEX.test(ticketId)) return { error: MENSAJE_ERROR_GENERICO };
  if (Number.isNaN(monto) || monto < 1000) {
    return { error: 'El monto debe ser de mínimo $1.000.' };
  }

  const admin = await exigirAdmin();
  try {
    // Se crea el abono y se confirma con la RPC (la matemática queda atómica).
    const { data: abono, error: errorInsertar } = await admin
      .from('abonos')
      .insert({ ticket_id: ticketId, monto })
      .select('id')
      .single();
    if (errorInsertar || !abono) {
      console.error('abono manual (insert):', errorInsertar?.message);
      return { error: MENSAJE_ERROR_GENERICO };
    }

    const { data, error } = await admin.rpc('confirmar_abono', {
      p_abono_id: abono.id,
      p_monto: monto,
    });
    if (error || !(data as ResultadoAbono).ok) {
      await admin.from('abonos').delete().eq('id', abono.id);
      const codigo = (data as ResultadoAbono | null)?.error;
      console.error('abono manual (confirmar):', error?.message ?? codigo);
      return { error: mensajeAdmin(codigo) };
    }

    const resultado = data as ResultadoAbono;
    refrescarTodo();
    const numero = dosDigitos(resultado.numero ?? 0);
    return {
      exito:
        resultado.estado === 'vendido'
          ? `✅ N.º ${numero} quedó VENDIDO (completó el pago).`
          : `✅ Abono registrado: N.º ${numero} va en ${formatearPesos(resultado.total ?? monto)}.`,
    };
  } catch (error: unknown) {
    console.error('accionAbonoManual:', error);
    return { error: MENSAJE_ERROR_GENERICO };
  }
}

export async function accionRechazarPago(
  _prev: EstadoAdmin,
  formData: FormData
): Promise<EstadoAdmin> {
  const ticketId = String(formData.get('ticketId') ?? '');
  const motivo = String(formData.get('motivo') ?? '').trim() || null;
  if (!UUID_REGEX.test(ticketId)) return { error: MENSAJE_ERROR_GENERICO };

  const admin = await exigirAdmin();
  try {
    // Se guarda la ruta ANTES de rechazar (el rechazo la borra de la fila).
    const { data: ticket } = await admin
      .from('tickets')
      .select('comprobante_url')
      .eq('id', ticketId)
      .single();

    const { data, error } = await admin.rpc('rechazar_pago', {
      p_ticket_id: ticketId,
      p_motivo: motivo,
    });
    if (error) {
      console.error('rechazar_pago:', error.message);
      return { error: MENSAJE_ERROR_GENERICO };
    }
    const resultado = data as ResultadoTransicion;
    if (!resultado.ok) return { error: mensajeAdmin(resultado.error) };

    // Limpieza del archivo (mejor esfuerzo: si falla, solo queda un huérfano).
    if (ticket?.comprobante_url) {
      const { error: errorBorrado } = await admin.storage
        .from('comprobantes')
        .remove([ticket.comprobante_url]);
      if (errorBorrado) {
        console.error('No se pudo borrar el comprobante:', errorBorrado.message);
      }
    }
  } catch (error: unknown) {
    console.error('accionRechazarPago:', error);
    return { error: MENSAJE_ERROR_GENERICO };
  }

  refrescarTodo();
  return { exito: 'Número liberado: vuelve a estar disponible.' };
}

export async function accionLiberarVencidas(
  _prev: EstadoAdmin,
  _formData: FormData
): Promise<EstadoAdmin> {
  const admin = await exigirAdmin();
  try {
    const { data, error } = await admin.rpc('liberar_expirados');
    if (error) {
      console.error('liberar_expirados:', error.message);
      return { error: MENSAJE_ERROR_GENERICO };
    }
    refrescarTodo();
    const liberadas = data as number;
    return {
      exito:
        liberadas === 0
          ? 'No había reservas vencidas.'
          : `${liberadas} reserva(s) vencida(s) liberada(s).`,
    };
  } catch (error: unknown) {
    console.error('accionLiberarVencidas:', error);
    return { error: MENSAJE_ERROR_GENERICO };
  }
}

/* ------------------------------------------------------------------ */
/* Venta manual (efectivo, WhatsApp o pagos atrasados)                 */
/* ------------------------------------------------------------------ */

export async function accionVentaManual(
  _prev: EstadoAdmin,
  formData: FormData
): Promise<EstadoAdmin> {
  const parseo = esquemaReserva.safeParse({
    raffleId: formData.get('raffleId'),
    numero: formData.get('numero'),
    nombre: formData.get('nombre'),
    whatsapp: normalizarWhatsapp(String(formData.get('whatsapp') ?? '')),
  });
  if (!parseo.success) {
    const campo = parseo.error.issues[0]?.path[0];
    if (campo === 'whatsapp') return { error: MENSAJES_ADMIN.whatsapp_invalido };
    if (campo === 'nombre') return { error: MENSAJES_ADMIN.nombre_invalido };
    return { error: 'Revisa el número: debe estar entre 00 y 99.' };
  }
  const monto = Number.parseInt(String(formData.get('monto') ?? ''), 10);
  if (Number.isNaN(monto) || monto < 1000) {
    return { error: 'El monto recibido debe ser de mínimo $1.000.' };
  }

  const admin = await exigirAdmin();
  try {
    const { data: rifa } = await admin
      .from('raffles')
      .select('precio_por_numero')
      .eq('id', parseo.data.raffleId)
      .single();
    const precio = rifa?.precio_por_numero ?? 0;
    if (monto > precio) {
      return { error: `El monto no puede superar el valor de la boleta (${formatearPesos(precio)}).` };
    }

    // Limpia reservas vencidas para que un número "vencido" cuente como libre.
    await admin.rpc('liberar_expirados');

    // Registro directo con actualización condicional (atómica): solo aplica
    // si el número sigue disponible. Funciona incluso con la rifa cerrada:
    // el admin siempre puede regularizar un pago atrasado.
    const token = crypto.randomUUID();
    const completo = monto >= precio;
    const { data, error } = await admin
      .from('tickets')
      .update({
        estado: completo ? 'vendido' : 'abonado',
        comprador_nombre: parseo.data.nombre,
        comprador_whatsapp: parseo.data.whatsapp,
        token_gestion: token,
        total_abonado: monto,
        reservado_hasta: null,
        confirmado_en: completo ? new Date().toISOString() : null,
      })
      .eq('raffle_id', parseo.data.raffleId)
      .eq('numero', parseo.data.numero)
      .eq('estado', 'disponible')
      .select('id')
      .single();

    if (error || !data) {
      return { error: MENSAJES_ADMIN.numero_ocupado };
    }

    const { error: errorAbono } = await admin.from('abonos').insert({
      ticket_id: data.id,
      monto,
      estado: 'confirmado',
      resuelto_en: new Date().toISOString(),
    });
    if (errorAbono) {
      console.error('abono de venta manual:', errorAbono.message);
    }

    const { error: errorAuditoria } = await admin.from('audit_log').insert({
      ticket_id: data.id,
      accion: 'venta_manual',
      estado_anterior: 'disponible',
      estado_nuevo: completo ? 'vendido' : 'abonado',
      actor: 'admin',
      detalle: {
        nombre: parseo.data.nombre,
        whatsapp: parseo.data.whatsapp,
        monto,
      },
    });
    if (errorAuditoria) {
      console.error('auditoría de venta manual:', errorAuditoria.message);
    }

    refrescarTodo();
    return {
      exito: completo
        ? `✅ Número ${dosDigitos(parseo.data.numero)} vendido a ${parseo.data.nombre} (100% pago).`
        : `✅ Número ${dosDigitos(parseo.data.numero)} apartado para ${parseo.data.nombre} con ${formatearPesos(monto)} (debe ${formatearPesos(precio - monto)}).`,
      enlaceBoleta: `${await urlBase()}/boleta/${data.id}?t=${token}`,
    };
  } catch (error: unknown) {
    console.error('accionVentaManual:', error);
    return { error: MENSAJE_ERROR_GENERICO };
  }
}

/* ------------------------------------------------------------------ */
/* Revertir una venta (confirmada por error)                           */
/* ------------------------------------------------------------------ */

/**
 * Deshace el ÚLTIMO abono confirmado de un número (confirmado por error):
 * el abono vuelve a "en revisión" para decidir de nuevo, y el total se recalcula.
 */
export async function accionRevertirVenta(
  _prev: EstadoAdmin,
  formData: FormData
): Promise<EstadoAdmin> {
  const ticketId = String(formData.get('ticketId') ?? '');
  const motivo = String(formData.get('motivo') ?? '').trim() || null;
  if (!UUID_REGEX.test(ticketId)) return { error: MENSAJE_ERROR_GENERICO };

  const admin = await exigirAdmin();
  try {
    const { data: ticket } = await admin
      .from('tickets')
      .select('id, numero, estado, total_abonado')
      .eq('id', ticketId)
      .single();
    if (!ticket || (ticket.estado !== 'vendido' && ticket.estado !== 'abonado')) {
      return { error: 'Solo se revierte un número vendido o abonado. Refresca la página.' };
    }

    const { data: abono } = await admin
      .from('abonos')
      .select('id, monto')
      .eq('ticket_id', ticketId)
      .eq('estado', 'confirmado')
      .order('resuelto_en', { ascending: false })
      .limit(1)
      .single();
    if (!abono) {
      return { error: 'Este número no tiene abonos confirmados para revertir.' };
    }

    const nuevoTotal = (ticket.total_abonado ?? 0) - abono.monto;
    if (nuevoTotal < 0) return { error: MENSAJE_ERROR_GENERICO };
    const nuevoEstado = nuevoTotal > 0 ? 'abonado' : 'en_revision';

    const { error: errorAbono } = await admin
      .from('abonos')
      .update({ estado: 'en_revision', resuelto_en: null })
      .eq('id', abono.id)
      .eq('estado', 'confirmado');
    if (errorAbono) {
      console.error('revertir (abono):', errorAbono.message);
      return { error: MENSAJE_ERROR_GENERICO };
    }

    const { error: errorTicket } = await admin
      .from('tickets')
      .update({
        total_abonado: nuevoTotal,
        estado: nuevoEstado,
        confirmado_en: null,
      })
      .eq('id', ticketId);
    if (errorTicket) {
      console.error('revertir (ticket):', errorTicket.message);
      return { error: MENSAJE_ERROR_GENERICO };
    }

    const { error: errorAuditoria } = await admin.from('audit_log').insert({
      ticket_id: ticket.id,
      accion: 'abono_revertido',
      estado_anterior: ticket.estado,
      estado_nuevo: nuevoEstado,
      actor: 'admin',
      detalle: { motivo, monto: abono.monto, nuevo_total: nuevoTotal },
    });
    if (errorAuditoria) {
      console.error('auditoría de reversa:', errorAuditoria.message);
    }

    refrescarTodo();
    return {
      exito: `↩️ Último abono (${formatearPesos(abono.monto)}) del N.º ${dosDigitos(ticket.numero as number)} devuelto a revisión. Confírmalo con el monto correcto o recházalo.`,
    };
  } catch (error: unknown) {
    console.error('accionRevertirVenta:', error);
    return { error: MENSAJE_ERROR_GENERICO };
  }
}

/* ------------------------------------------------------------------ */
/* Configuración de la rifa                                            */
/* ------------------------------------------------------------------ */

export async function accionGuardarConfiguracion(
  _prev: EstadoAdmin,
  formData: FormData
): Promise<EstadoAdmin> {
  const parseo = esquemaConfiguracion.safeParse({
    raffleId: formData.get('raffleId'),
    llave: formData.get('llave'),
    numeroNequi: formData.get('numeroNequi'),
    minutos: formData.get('minutos'),
    abonoMinimo: formData.get('abonoMinimo'),
  });
  if (!parseo.success) {
    const campo = parseo.error.issues[0]?.path[0];
    if (campo === 'minutos') {
      return { error: 'Los minutos de reserva deben estar entre 5 y 120.' };
    }
    if (campo === 'abonoMinimo') {
      return { error: 'El abono mínimo debe estar entre $1.000 y $60.000.' };
    }
    return { error: 'Revisa los datos del formulario.' };
  }

  const numeroNequi = normalizarWhatsapp(parseo.data.numeroNequi);
  if (numeroNequi && !/^3\d{9}$/.test(numeroNequi)) {
    return { error: 'El número Nequi debe ser un celular de 10 dígitos (3XXXXXXXXX).' };
  }

  const admin = await exigirAdmin();
  try {
    const { error } = await admin
      .from('raffles')
      .update({
        nequi_llave: parseo.data.llave || null,
        nequi_numero: numeroNequi || null,
        minutos_reserva: parseo.data.minutos,
        abono_minimo: parseo.data.abonoMinimo,
      })
      .eq('id', parseo.data.raffleId);
    if (error) {
      console.error('guardar configuración:', error.message);
      return { error: MENSAJE_ERROR_GENERICO };
    }
  } catch (error: unknown) {
    console.error('accionGuardarConfiguracion:', error);
    return { error: MENSAJE_ERROR_GENERICO };
  }

  refrescarTodo();
  return { exito: 'Configuración guardada. La página pública ya muestra los nuevos datos.' };
}

const EXTENSION_QR: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function accionSubirQr(
  _prev: EstadoAdmin,
  formData: FormData
): Promise<EstadoAdmin> {
  const raffleId = String(formData.get('raffleId') ?? '');
  if (!UUID_REGEX.test(raffleId)) return { error: MENSAJE_ERROR_GENERICO };

  const archivo = formData.get('archivo');
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: 'Selecciona la imagen del QR.' };
  }
  if (archivo.size > QR_MAX_BYTES) {
    return { error: 'La imagen pesa más de 2 MB. Expórtala más liviana.' };
  }
  if (!(COMPROBANTE_TIPOS_PERMITIDOS as readonly string[]).includes(archivo.type)) {
    return { error: 'Formato no válido. Sube una imagen JPG, PNG o WebP.' };
  }

  const admin = await exigirAdmin();
  try {
    const { data: rifa } = await admin
      .from('raffles')
      .select('nequi_qr_url')
      .eq('id', raffleId)
      .single();

    // Nombre nuevo en cada subida: evita problemas de caché en los navegadores.
    const ruta = `qr-nequi-${Date.now()}.${EXTENSION_QR[archivo.type]}`;
    const { error: errorSubida } = await admin.storage
      .from('publico')
      .upload(ruta, await archivo.arrayBuffer(), { contentType: archivo.type });
    if (errorSubida) {
      console.error('subida de QR:', errorSubida.message);
      return { error: MENSAJE_ERROR_GENERICO };
    }

    const { data: publica } = admin.storage.from('publico').getPublicUrl(ruta);
    const { error: errorGuardar } = await admin
      .from('raffles')
      .update({ nequi_qr_url: publica.publicUrl })
      .eq('id', raffleId);
    if (errorGuardar) {
      console.error('guardar URL del QR:', errorGuardar.message);
      return { error: MENSAJE_ERROR_GENERICO };
    }

    // Borra el QR anterior (mejor esfuerzo).
    const rutaAnterior = rifa?.nequi_qr_url?.split('/publico/')[1];
    if (rutaAnterior) {
      await admin.storage.from('publico').remove([rutaAnterior]);
    }
  } catch (error: unknown) {
    console.error('accionSubirQr:', error);
    return { error: MENSAJE_ERROR_GENERICO };
  }

  refrescarTodo();
  return { exito: 'QR actualizado: ya se ve en la pantalla de pago.' };
}

/* ------------------------------------------------------------------ */
/* Sorteo: cierre de ventas y ganador                                  */
/* ------------------------------------------------------------------ */

async function cambiarEstadoRifa(
  formData: FormData,
  estado: 'activa' | 'cerrada',
  accionAuditoria: string,
  mensajeExito: string
): Promise<EstadoAdmin> {
  const raffleId = String(formData.get('raffleId') ?? '');
  if (!UUID_REGEX.test(raffleId)) return { error: MENSAJE_ERROR_GENERICO };

  const admin = await exigirAdmin();
  try {
    const { error } = await admin
      .from('raffles')
      .update({ estado })
      .eq('id', raffleId);
    if (error) {
      console.error(`${accionAuditoria}:`, error.message);
      return { error: MENSAJE_ERROR_GENERICO };
    }

    const { error: errorAuditoria } = await admin.from('audit_log').insert({
      accion: accionAuditoria,
      actor: 'admin',
    });
    if (errorAuditoria) {
      console.error('auditoría de estado de rifa:', errorAuditoria.message);
    }
  } catch (error: unknown) {
    console.error(accionAuditoria, error);
    return { error: MENSAJE_ERROR_GENERICO };
  }

  refrescarTodo();
  return { exito: mensajeExito };
}

export async function accionCerrarRifa(
  _prev: EstadoAdmin,
  formData: FormData
): Promise<EstadoAdmin> {
  return cambiarEstadoRifa(
    formData,
    'cerrada',
    'rifa_cerrada',
    'Ventas cerradas. La página pública ya muestra el estado del sorteo.'
  );
}

export async function accionReabrirRifa(
  _prev: EstadoAdmin,
  formData: FormData
): Promise<EstadoAdmin> {
  return cambiarEstadoRifa(
    formData,
    'activa',
    'rifa_reabierta',
    'Ventas reabiertas: el tablero vuelve a estar disponible.'
  );
}

export async function accionRegistrarGanador(
  _prev: EstadoAdmin,
  formData: FormData
): Promise<EstadoAdmin> {
  const raffleId = String(formData.get('raffleId') ?? '');
  if (!UUID_REGEX.test(raffleId)) return { error: MENSAJE_ERROR_GENERICO };

  const numeroCrudo = String(formData.get('numero') ?? '').trim();

  // Campo vacío = quitar el ganador registrado.
  let numeroGanador: number | null = null;
  if (numeroCrudo !== '') {
    const numero = Number.parseInt(numeroCrudo, 10);
    if (Number.isNaN(numero) || numero < 0 || numero > 99) {
      return { error: 'El número ganador debe estar entre 00 y 99.' };
    }
    numeroGanador = numero;
  }

  const admin = await exigirAdmin();
  try {
    const { error } = await admin
      .from('raffles')
      .update({ numero_ganador: numeroGanador })
      .eq('id', raffleId);
    if (error) {
      console.error('registrar ganador:', error.message);
      return { error: MENSAJE_ERROR_GENERICO };
    }

    const { error: errorAuditoria } = await admin.from('audit_log').insert({
      accion: numeroGanador === null ? 'ganador_quitado' : 'ganador_registrado',
      actor: 'admin',
      detalle: numeroGanador === null ? null : { numero: numeroGanador },
    });
    if (errorAuditoria) {
      console.error('auditoría de ganador:', errorAuditoria.message);
    }

    refrescarTodo();

    if (numeroGanador === null) {
      return { exito: 'Ganador retirado de la página pública.' };
    }

    // Le contamos al admin de una vez quién tiene ese número.
    const { data: ticket } = await admin
      .from('tickets')
      .select('estado, comprador_nombre')
      .eq('raffle_id', raffleId)
      .eq('numero', numeroGanador)
      .single();

    const detalleGanador =
      ticket?.estado === 'vendido'
        ? ` — lo tiene ${ticket.comprador_nombre}. ¡Avísale!`
        : ' — ese número NO fue vendido.';
    return {
      exito: `🏆 Ganador registrado: N.º ${dosDigitos(numeroGanador)}${detalleGanador}`,
    };
  } catch (error: unknown) {
    console.error('accionRegistrarGanador:', error);
    return { error: MENSAJE_ERROR_GENERICO };
  }
}

export async function accionQuitarQr(
  _prev: EstadoAdmin,
  formData: FormData
): Promise<EstadoAdmin> {
  const raffleId = String(formData.get('raffleId') ?? '');
  if (!UUID_REGEX.test(raffleId)) return { error: MENSAJE_ERROR_GENERICO };

  const admin = await exigirAdmin();
  try {
    const { data: rifa } = await admin
      .from('raffles')
      .select('nequi_qr_url')
      .eq('id', raffleId)
      .single();

    const { error } = await admin
      .from('raffles')
      .update({ nequi_qr_url: null })
      .eq('id', raffleId);
    if (error) {
      console.error('quitar QR:', error.message);
      return { error: MENSAJE_ERROR_GENERICO };
    }

    const rutaAnterior = rifa?.nequi_qr_url?.split('/publico/')[1];
    if (rutaAnterior) {
      await admin.storage.from('publico').remove([rutaAnterior]);
    }
  } catch (error: unknown) {
    console.error('accionQuitarQr:', error);
    return { error: MENSAJE_ERROR_GENERICO };
  }

  refrescarTodo();
  return { exito: 'QR retirado: la pantalla de pago vuelve a mostrar el espacio reservado.' };
}
