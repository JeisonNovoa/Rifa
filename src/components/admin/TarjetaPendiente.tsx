"use client";

import { useActionState } from "react";
import {
  accionConfirmarPago,
  accionRechazarPago,
  type EstadoAdmin,
} from "@/lib/acciones/admin";
import { dosDigitos } from "@/lib/formato";
import { BotonAccion } from "./BotonAccion";

interface TarjetaPendienteProps {
  ticketId: string;
  numero: number;
  nombre: string | null;
  whatsapp: string | null;
  urlComprobante: string | null;
  actualizadoHace: string;
}

/** Boleta crema con un pago pendiente de revisión y sus acciones. */
export function TarjetaPendiente({
  ticketId,
  numero,
  nombre,
  whatsapp,
  urlComprobante,
  actualizadoHace,
}: TarjetaPendienteProps) {
  return (
    <article className="overflow-hidden rounded-2xl bg-crema-50 text-noche-900 shadow-lg shadow-noche-950/40">
      <div className="perforado" aria-hidden="true" />
      <div className="flex gap-4 p-4 sm:p-5">
        {/* Talón con el número */}
        <div className="shrink-0 border-r-2 border-dashed border-noche-900/20 pr-4 text-center">
          <p className="font-titulo text-[10px] tracking-[0.2em] text-rojo-500">
            N.º
          </p>
          <p className="font-titulo text-4xl leading-none text-rojo-500">
            {dosDigitos(numero)}
          </p>
          <p className="mt-2 text-[11px] text-noche-900/50">{actualizadoHace}</p>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{nombre ?? "Sin nombre"}</p>
          {whatsapp && (
            <a
              href={`https://wa.me/57${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-noche-900/60 underline decoration-noche-900/30 underline-offset-2 hover:text-noche-900"
            >
              {whatsapp} · WhatsApp ↗
            </a>
          )}

          {urlComprobante ? (
            <a
              href={urlComprobante}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block w-fit"
              title="Abrir el comprobante en grande"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={urlComprobante}
                alt={`Comprobante del número ${dosDigitos(numero)}`}
                className="h-28 rounded-lg border border-noche-900/15 object-cover"
              />
              <span className="mt-1 block text-xs text-noche-900/50">
                Toca para verlo grande ↗
              </span>
            </a>
          ) : (
            <p className="mt-3 text-xs text-noche-900/50">
              Sin archivo adjunto (¿te llegó el comprobante por WhatsApp?).
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-start gap-3">
            <BotonAccion
              accion={accionConfirmarPago}
              campos={{ ticketId }}
              etiqueta="Confirmar pago"
              etiquetaPendiente="Confirmando…"
              variante="dorado"
              confirmacion={`¿Confirmar el pago del número ${dosDigitos(numero)}? Verifica primero que la plata SÍ llegó a tu Nequi.`}
            />

            <details>
              <summary className="cursor-pointer list-none rounded-lg border border-noche-900/20 px-4 py-2 text-sm font-semibold text-noche-900/60 transition-colors hover:bg-noche-900/5">
                Rechazar…
              </summary>
              <FormularioRechazo ticketId={ticketId} numero={numero} />
            </details>
          </div>
        </div>
      </div>
      <div className="perforado" aria-hidden="true" />
    </article>
  );
}

const ESTADO_INICIAL: EstadoAdmin = {};

/** Formulario auto-contenido: motivo opcional + rechazo con confirmación. */
function FormularioRechazo({
  ticketId,
  numero,
}: {
  ticketId: string;
  numero: number;
}) {
  const [estado, enviar, pendiente] = useActionState(
    accionRechazarPago,
    ESTADO_INICIAL
  );

  return (
    <form
      action={enviar}
      className="mt-2 max-w-sm"
      onSubmit={(evento) => {
        const mensaje = `¿Rechazar el pago del ${dosDigitos(numero)}? El número quedará libre y los datos del comprador se borran (el historial se conserva).`;
        if (!window.confirm(mensaje)) evento.preventDefault();
      }}
    >
      <input type="hidden" name="ticketId" value={ticketId} />
      <input
        type="text"
        name="motivo"
        placeholder="Motivo (opcional, queda en el historial)"
        maxLength={120}
        disabled={pendiente}
        className="w-full rounded-lg border border-noche-900/20 bg-white/70 px-3 py-2 text-sm text-noche-900 placeholder:text-noche-900/35 focus:border-noche-900/50 focus:outline-none disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={pendiente}
        className="mt-2 rounded-lg border border-rojo-500/50 px-4 py-2 text-sm font-semibold text-rojo-500 transition-colors hover:bg-rojo-500/10 disabled:opacity-60"
      >
        {pendiente ? "Liberando…" : "Rechazar y liberar número"}
      </button>
      {estado.error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-rojo-500">
          {estado.error}
        </p>
      )}
      {estado.exito && (
        <p className="mt-1.5 text-xs font-medium text-noche-900/70">
          {estado.exito}
        </p>
      )}
    </form>
  );
}
