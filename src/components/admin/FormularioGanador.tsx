"use client";

import { useActionState } from "react";
import {
  accionRegistrarGanador,
  type EstadoAdmin,
} from "@/lib/acciones/admin";

interface FormularioGanadorProps {
  raffleId: string;
}

const ESTADO_INICIAL: EstadoAdmin = {};

export function FormularioGanador({ raffleId }: FormularioGanadorProps) {
  const [estado, enviar, pendiente] = useActionState(
    accionRegistrarGanador,
    ESTADO_INICIAL
  );

  return (
    <form action={enviar} className="mt-3">
      <input type="hidden" name="raffleId" value={raffleId} />
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-noche-300">
            Número ganador (00–99)
          </span>
          <input
            name="numero"
            type="number"
            required
            min={0}
            max={99}
            placeholder="45"
            disabled={pendiente}
            className="w-28 rounded-lg border border-noche-600 bg-noche-900/60 px-3 py-2.5 text-sm text-crema-50 placeholder:text-noche-400 focus:border-dorado-400 focus:outline-none disabled:opacity-60"
          />
        </label>
        <button
          type="submit"
          disabled={pendiente}
          className="btn-dorado !px-5 !py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendiente ? "Registrando…" : "Registrar ganador"}
        </button>
      </div>

      {estado.error && (
        <p role="alert" className="mt-2 text-sm font-medium text-rojo-400">
          {estado.error}
        </p>
      )}
      {estado.exito && (
        <p className="mt-2 text-sm font-medium text-dorado-300">{estado.exito}</p>
      )}
    </form>
  );
}
