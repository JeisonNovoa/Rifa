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
import { dosDigitos } from '@/lib/formato';
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

export async function accionConfirmarPago(
  _prev: EstadoAdmin,
  formData: FormData
): Promise<EstadoAdmin> {
  const ticketId = String(formData.get('ticketId') ?? '');
  if (!UUID_REGEX.test(ticketId)) return { error: MENSAJE_ERROR_GENERICO };

  const admin = await exigirAdmin();
  try {
    const { data, error } = await admin.rpc('confirmar_pago', {
      p_ticket_id: ticketId,
    });
    if (error) {
      console.error('confirmar_pago:', error.message);
      return { error: MENSAJE_ERROR_GENERICO };
    }
    const resultado = data as ResultadoTransicion;
    if (!resultado.ok) return { error: mensajeAdmin(resultado.error) };
  } catch (error: unknown) {
    console.error('accionConfirmarPago:', error);
    return { error: MENSAJE_ERROR_GENERICO };
  }

  refrescarTodo();
  return { exito: '✅ Pago confirmado: el número quedó vendido.' };
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

  const admin = await exigirAdmin();
  try {
    // Limpia reservas vencidas para que un número "vencido" cuente como libre.
    await admin.rpc('liberar_expirados');

    // Venta directa con actualización condicional (atómica): solo aplica si
    // el número sigue disponible. Funciona incluso con la rifa cerrada:
    // el admin siempre puede regularizar un pago atrasado.
    const token = crypto.randomUUID();
    const { data, error } = await admin
      .from('tickets')
      .update({
        estado: 'vendido',
        comprador_nombre: parseo.data.nombre,
        comprador_whatsapp: parseo.data.whatsapp,
        token_gestion: token,
        reservado_hasta: null,
        confirmado_en: new Date().toISOString(),
      })
      .eq('raffle_id', parseo.data.raffleId)
      .eq('numero', parseo.data.numero)
      .eq('estado', 'disponible')
      .select('id')
      .single();

    if (error || !data) {
      return { error: MENSAJES_ADMIN.numero_ocupado };
    }

    const { error: errorAuditoria } = await admin.from('audit_log').insert({
      ticket_id: data.id,
      accion: 'venta_manual',
      estado_anterior: 'disponible',
      estado_nuevo: 'vendido',
      actor: 'admin',
      detalle: { nombre: parseo.data.nombre, whatsapp: parseo.data.whatsapp },
    });
    if (errorAuditoria) {
      console.error('auditoría de venta manual:', errorAuditoria.message);
    }

    refrescarTodo();
    return {
      exito: `✅ Número ${dosDigitos(parseo.data.numero)} vendido a ${parseo.data.nombre}.`,
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

export async function accionRevertirVenta(
  _prev: EstadoAdmin,
  formData: FormData
): Promise<EstadoAdmin> {
  const ticketId = String(formData.get('ticketId') ?? '');
  const motivo = String(formData.get('motivo') ?? '').trim() || null;
  if (!UUID_REGEX.test(ticketId)) return { error: MENSAJE_ERROR_GENERICO };

  const admin = await exigirAdmin();
  try {
    // Update condicional: solo aplica si sigue vendido (evita carreras).
    const { data, error } = await admin
      .from('tickets')
      .update({ estado: 'en_revision', confirmado_en: null })
      .eq('id', ticketId)
      .eq('estado', 'vendido')
      .select('id, numero, comprador_nombre, comprador_whatsapp')
      .single();

    if (error || !data) {
      return { error: 'Solo se puede revertir un número vendido. Refresca la página.' };
    }

    const { error: errorAuditoria } = await admin.from('audit_log').insert({
      ticket_id: data.id,
      accion: 'venta_revertida',
      estado_anterior: 'vendido',
      estado_nuevo: 'en_revision',
      actor: 'admin',
      detalle: {
        motivo,
        nombre: data.comprador_nombre,
        whatsapp: data.comprador_whatsapp,
      },
    });
    if (errorAuditoria) {
      console.error('auditoría de reversa:', errorAuditoria.message);
    }

    refrescarTodo();
    return {
      exito: `Venta del ${dosDigitos(data.numero as number)} revertida: volvió a "en revisión". Desde ahí puedes confirmarla o rechazarla.`,
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
  });
  if (!parseo.success) {
    const campo = parseo.error.issues[0]?.path[0];
    if (campo === 'minutos') {
      return { error: 'Los minutos de reserva deben estar entre 5 y 120.' };
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
