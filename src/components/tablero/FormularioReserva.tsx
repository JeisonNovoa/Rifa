"use client";

import { useActionState } from "react";
import {
  accionReservarNumero,
  type EstadoAccion,
} from "@/lib/acciones/reservas";
import { dosDigitos } from "@/lib/formato";

interface FormularioReservaProps {
  raffleId: string;
  numero: number;
  onCancelar: () => void;
}

const ESTADO_INICIAL: EstadoAccion = {};

const ESTILO_INPUT =
  "w-full rounded-lg border border-noche-900/20 bg-white/70 px-3 py-2.5 text-sm text-noche-900 placeholder:text-noche-900/35 focus:border-noche-900/50 focus:outline-none disabled:opacity-60";

/** Se despliega dentro de la boleta de selección para apartar el número. */
export function FormularioReserva({
  raffleId,
  numero,
  onCancelar,
}: FormularioReservaProps) {
  const [estado, enviar, pendiente] = useActionState(
    accionReservarNumero,
    ESTADO_INICIAL
  );

  return (
    <form
      action={enviar}
      className="border-t-2 border-dashed border-noche-900/15 px-4 pb-4 pt-3 sm:px-5"
    >
      <input type="hidden" name="raffleId" value={raffleId} />
      <input type="hidden" name="numero" value={numero} />

      <p className="text-sm font-semibold">
        Apartar el {dosDigitos(numero)} — dinos quién eres
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-noche-900/60">
            Tu nombre
          </span>
          <input
            name="nombre"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            placeholder="Nombre y apellido"
            disabled={pendiente}
            className={ESTILO_INPUT}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-noche-900/60">
            WhatsApp (celular)
          </span>
          <input
            name="whatsapp"
            required
            type="tel"
            inputMode="numeric"
            pattern="3[0-9]{9}"
            maxLength={10}
            title="Celular colombiano de 10 dígitos que empiece por 3"
            placeholder="3001234567"
            autoComplete="tel-national"
            disabled={pendiente}
            className={ESTILO_INPUT}
          />
        </label>
      </div>

      {estado.error && (
        <p role="alert" className="mt-2 text-sm font-medium text-rojo-500">
          {estado.error}
        </p>
      )}

      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={pendiente}
          className="btn-dorado flex-1 !py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendiente ? "Apartando…" : `Apartar el ${dosDigitos(numero)}`}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          disabled={pendiente}
          className="text-sm font-medium text-noche-900/50 transition-colors hover:text-noche-900"
        >
          Cancelar
        </button>
      </div>

      <p className="mt-2.5 text-xs text-noche-900/50">
        Solo usamos tu WhatsApp para confirmarte el pago y avisarte del sorteo.
      </p>
    </form>
  );
}
