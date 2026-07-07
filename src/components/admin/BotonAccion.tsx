"use client";

import { useActionState } from "react";
import type { EstadoAdmin } from "@/lib/acciones/admin";
import { BotonCopiar } from "@/components/boleta/BotonCopiar";

interface BotonAccionProps {
  accion: (estado: EstadoAdmin, formData: FormData) => Promise<EstadoAdmin>;
  /** Campos ocultos que necesita la acción (ticketId, motivo, etc.) */
  campos?: Record<string, string>;
  etiqueta: string;
  etiquetaPendiente?: string;
  variante?: "dorado" | "peligro" | "sutil";
  /** Si se define, pide confirmación nativa antes de enviar. */
  confirmacion?: string;
  className?: string;
}

const ESTADO_INICIAL: EstadoAdmin = {};

const VARIANTES: Record<NonNullable<BotonAccionProps["variante"]>, string> = {
  dorado: "btn-dorado !px-4 !py-2 text-sm",
  peligro:
    "rounded-lg border border-rojo-500/50 px-4 py-2 text-sm font-semibold text-rojo-400 transition-colors hover:bg-rojo-500/10 disabled:opacity-60",
  sutil:
    "rounded-lg border border-noche-600 px-4 py-2 text-sm font-semibold text-crema-50 transition-colors hover:border-dorado-400 hover:text-dorado-300 disabled:opacity-60",
};

/** Botón que ejecuta una acción de admin y muestra el resultado en línea. */
export function BotonAccion({
  accion,
  campos = {},
  etiqueta,
  etiquetaPendiente = "Un momento…",
  variante = "sutil",
  confirmacion,
  className = "",
}: BotonAccionProps) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);

  return (
    <form
      action={enviar}
      className={`inline-block ${className}`}
      onSubmit={(evento) => {
        if (confirmacion && !window.confirm(confirmacion)) {
          evento.preventDefault();
        }
      }}
    >
      {Object.entries(campos).map(([nombre, valor]) => (
        <input key={nombre} type="hidden" name={nombre} value={valor} />
      ))}
      <button type="submit" disabled={pendiente} className={VARIANTES[variante]}>
        {pendiente ? etiquetaPendiente : etiqueta}
      </button>

      {estado.error && (
        <p role="alert" className="mt-1.5 max-w-56 text-xs font-medium text-rojo-400">
          {estado.error}
        </p>
      )}
      {estado.exito && (
        <p className="mt-1.5 max-w-56 text-xs font-medium text-dorado-300">
          {estado.exito}
        </p>
      )}
      {estado.enlaceBoleta && (
        <span className="mt-1.5 block">
          <BotonCopiar
            valor={estado.enlaceBoleta}
            etiqueta="Copiar boleta del comprador"
            apariencia="oscura"
          />
        </span>
      )}
    </form>
  );
}
