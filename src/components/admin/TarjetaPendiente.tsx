"use client";

import { useActionState, useState } from "react";
import { IconoListo, IconoWhatsApp } from "@/components/decoracion/Iconos";
import {
  accionConfirmarAbono,
  accionRechazarAbono,
  type EstadoAdmin,
} from "@/lib/acciones/admin";
import { dosDigitos, formatearPesos } from "@/lib/formato";
import { DialogoConfirmar } from "./DialogoConfirmar";
import { usarConfirmacion } from "./usarConfirmacion";

interface TarjetaPendienteProps {
  abonoId: string;
  numero: number;
  nombre: string | null;
  whatsapp: string | null;
  /** Lo que la persona DICE que pagó (el admin puede corregirlo) */
  montoDeclarado: number;
  /** Lo que ya tenía confirmado antes de este abono */
  totalPrevio: number;
  precio: number;
  urlComprobante: string | null;
  subidoHace: string;
}

const ESTADO_INICIAL: EstadoAdmin = {};

/** Boleta crema con un ABONO pendiente de revisión y sus acciones. */
export function TarjetaPendiente({
  abonoId,
  numero,
  nombre,
  whatsapp,
  montoDeclarado,
  totalPrevio,
  precio,
  urlComprobante,
  subidoHace,
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
          <p className="mt-2 text-[11px] text-noche-900/50">{subidoHace}</p>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{nombre ?? "Sin nombre"}</p>
          {whatsapp && (
            <a
              href={`https://wa.me/57${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-noche-900/60 underline decoration-noche-900/30 underline-offset-2 hover:text-noche-900"
            >
              <IconoWhatsApp className="h-4 w-4" />
              {whatsapp}
            </a>
          )}

          {/* El dato clave: cuánto dice haber pagado */}
          <p className="mt-2 text-sm text-noche-900/70">
            Dice haber pagado{" "}
            <strong className="font-titulo text-lg text-rojo-500">
              {formatearPesos(montoDeclarado)}
            </strong>
            {totalPrevio > 0 && (
              <> · ya tenía {formatearPesos(totalPrevio)} confirmados</>
            )}
            . Si es correcto, quedaría en{" "}
            <strong className="font-semibold">
              {formatearPesos(totalPrevio + montoDeclarado)}
            </strong>{" "}
            de {formatearPesos(precio)}{" "}
            {totalPrevio + montoDeclarado >= precio ? "→ VENDIDO ✓" : "→ abonado"}
          </p>

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
              Sin archivo adjunto (abono registrado a mano o comprobante por
              WhatsApp).
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-start gap-3">
            <FormularioConfirmarAbono
              abonoId={abonoId}
              montoDeclarado={montoDeclarado}
            />
            <details>
              <summary className="cursor-pointer list-none rounded-lg border border-noche-900/20 px-4 py-2 text-sm font-semibold text-noche-900/60 transition-colors hover:bg-noche-900/5">
                Rechazar…
              </summary>
              <FormularioRechazoAbono
                abonoId={abonoId}
                numero={numero}
                totalPrevio={totalPrevio}
              />
            </details>
          </div>
        </div>
      </div>
      <div className="perforado" aria-hidden="true" />
    </article>
  );
}

/** Confirmación con monto editable: la verdad es lo que llegó al Nequi. */
function FormularioConfirmarAbono({
  abonoId,
  montoDeclarado,
}: {
  abonoId: string;
  montoDeclarado: number;
}) {
  const [estado, enviar, pendiente] = useActionState(
    accionConfirmarAbono,
    ESTADO_INICIAL
  );
  const [monto, setMonto] = useState(montoDeclarado);
  const conf = usarConfirmacion();

  return (
    <form ref={conf.formRef} action={enviar} onSubmit={conf.alEnviar}>
      <DialogoConfirmar
        abierto={conf.abierto}
        titulo="Confirmar abono"
        mensaje={`¿Confirmar que llegaron ${formatearPesos(monto)} a tu Nequi? Revisa tu app primero.`}
        textoConfirmar="Sí, confirmar"
        onConfirmar={conf.confirmar}
        onCancelar={conf.cancelar}
      />
      <input type="hidden" name="abonoId" value={abonoId} />
      <div className="flex items-center gap-2">
        <input
          type="number"
          name="monto"
          min={1000}
          step={1000}
          value={monto}
          onChange={(evento) => setMonto(Number(evento.target.value))}
          disabled={pendiente}
          aria-label="Monto real recibido"
          className="w-28 rounded-lg border border-noche-900/25 bg-white/70 px-3 py-2 text-sm text-noche-900 focus:border-noche-900/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pendiente}
          className="btn-dorado !px-4 !py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendiente ? "Confirmando…" : "Confirmar abono"}
        </button>
      </div>
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

function FormularioRechazoAbono({
  abonoId,
  numero,
  totalPrevio,
}: {
  abonoId: string;
  numero: number;
  totalPrevio: number;
}) {
  const [estado, enviar, pendiente] = useActionState(
    accionRechazarAbono,
    ESTADO_INICIAL
  );
  const conf = usarConfirmacion();
  const mensajeRechazo =
    totalPrevio === 0
      ? `¿Rechazar este primer pago del ${dosDigitos(numero)}? El número quedará LIBRE y los datos del comprador se borran (el historial se conserva).`
      : `¿Rechazar este abono del ${dosDigitos(numero)}? El número sigue apartado con lo ya confirmado.`;

  return (
    <form
      ref={conf.formRef}
      action={enviar}
      className="mt-2 max-w-sm"
      onSubmit={conf.alEnviar}
    >
      <DialogoConfirmar
        abierto={conf.abierto}
        titulo={`Rechazar abono · N.º ${dosDigitos(numero)}`}
        mensaje={mensajeRechazo}
        textoConfirmar="Sí, rechazar"
        variante="peligro"
        onConfirmar={conf.confirmar}
        onCancelar={conf.cancelar}
      />
      <input type="hidden" name="abonoId" value={abonoId} />
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
        {pendiente ? "Rechazando…" : "Rechazar este abono"}
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
