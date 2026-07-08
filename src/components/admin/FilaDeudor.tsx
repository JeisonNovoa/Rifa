"use client";

import { useActionState, useState } from "react";
import { BotonCopiar } from "@/components/boleta/BotonCopiar";
import { IconoWhatsApp } from "@/components/decoracion/Iconos";
import {
  accionAbonoManual,
  accionRechazarPago,
  type EstadoAdmin,
} from "@/lib/acciones/admin";
import { dosDigitos, formatearPesos } from "@/lib/formato";
import { BotonAccion } from "./BotonAccion";

interface FilaDeudorProps {
  ticketId: string;
  numero: number;
  nombre: string | null;
  whatsapp: string | null;
  abonado: number;
  precio: number;
  enlaceBoleta: string | null;
}

const ESTADO_INICIAL: EstadoAdmin = {};

/** Fila de un número apartado que aún debe plata. */
export function FilaDeudor({
  ticketId,
  numero,
  nombre,
  whatsapp,
  abonado,
  precio,
  enlaceBoleta,
}: FilaDeudorProps) {
  const falta = precio - abonado;
  const porcentaje = Math.min(100, Math.round((abonado / precio) * 100));

  return (
    <div className="rounded-xl border border-noche-800 bg-noche-900/50 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-titulo text-xl text-dorado-400">
          {dosDigitos(numero)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-crema-50">
            {nombre ?? "Sin nombre"}
          </p>
          {whatsapp && (
            <a
              href={`https://wa.me/57${whatsapp}?text=${encodeURIComponent(
                `¡Hola! Te escribo de la rifa Viaja por Colombia 🎟️ Tu número ${dosDigitos(numero)} tiene abonados ${formatearPesos(abonado)}; te faltan ${formatearPesos(falta)} para completarlo. ¡Recuerda que boleta que no esté 100% paga no juega!`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-noche-300 underline decoration-noche-600 underline-offset-2 hover:text-crema-50"
            >
              <IconoWhatsApp className="h-3.5 w-3.5" />
              Cobrarle por WhatsApp
            </a>
          )}
        </div>
        <div className="w-40">
          <div className="h-2 overflow-hidden rounded-full border border-noche-700 bg-noche-950">
            <div
              className="h-full bg-dorado-400"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-noche-300">
            {formatearPesos(abonado)} ·{" "}
            <strong className="font-semibold text-rojo-400">
              debe {formatearPesos(falta)}
            </strong>
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-noche-800/70 pt-3">
        <FormularioAbonoRapido ticketId={ticketId} falta={falta} />
        {enlaceBoleta && (
          <BotonCopiar
            valor={enlaceBoleta}
            etiqueta="Copiar boleta"
            apariencia="oscura"
          />
        )}
        <BotonAccion
          accion={accionRechazarPago}
          campos={{ ticketId, motivo: "liberado por el admin (no completó el pago)" }}
          etiqueta="Liberar"
          etiquetaPendiente="Liberando…"
          variante="peligro"
          confirmacion={`¿Liberar el ${dosDigitos(numero)}? Pierde el número aunque haya abonado ${formatearPesos(abonado)} (la plata queda en el historial). Úsalo si venció el plazo.`}
        />
      </div>
    </div>
  );
}

/** Registrar un abono en efectivo/WhatsApp sin que suba comprobante. */
function FormularioAbonoRapido({
  ticketId,
  falta,
}: {
  ticketId: string;
  falta: number;
}) {
  const [estado, enviar, pendiente] = useActionState(
    accionAbonoManual,
    ESTADO_INICIAL
  );
  const [monto, setMonto] = useState(falta);

  return (
    <form
      action={enviar}
      onSubmit={(evento) => {
        if (!window.confirm(`¿Registrar un abono de ${formatearPesos(monto)}? Solo hazlo si YA recibiste la plata.`)) {
          evento.preventDefault();
        }
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="ticketId" value={ticketId} />
      <input
        type="number"
        name="monto"
        min={1000}
        max={falta}
        step={1000}
        value={monto}
        onChange={(evento) => setMonto(Number(evento.target.value))}
        disabled={pendiente}
        aria-label="Monto del abono manual"
        className="w-28 rounded-lg border border-noche-600 bg-noche-950/60 px-3 py-1.5 text-sm text-crema-50 focus:border-dorado-400 focus:outline-none"
      />
      <button
        type="submit"
        disabled={pendiente}
        className="rounded-lg border border-dorado-500/60 px-3 py-1.5 text-sm font-semibold text-dorado-300 transition-colors hover:bg-dorado-400/10 disabled:opacity-60"
      >
        {pendiente ? "Registrando…" : "+ Abono manual"}
      </button>
      {estado.error && (
        <p role="alert" className="w-full text-xs font-medium text-rojo-400">
          {estado.error}
        </p>
      )}
      {estado.exito && (
        <p className="w-full text-xs font-medium text-dorado-300">{estado.exito}</p>
      )}
    </form>
  );
}
