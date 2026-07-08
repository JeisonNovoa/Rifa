"use client";

import { useEffect, useRef } from "react";
import { IconoAlerta } from "@/components/decoracion/Iconos";

interface DialogoConfirmarProps {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  /** Texto del botón que confirma la acción */
  textoConfirmar?: string;
  /** "peligro" pinta el botón en rojo (acciones destructivas) */
  variante?: "dorado" | "peligro";
  onConfirmar: () => void;
  onCancelar: () => void;
}

/**
 * Diálogo de confirmación con la estética de la rifa (boleta crema),
 * en reemplazo del window.confirm() nativo. Usa <dialog> nativo para
 * el foco atrapado y el cierre con Escape sin librerías.
 */
export function DialogoConfirmar({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  variante = "dorado",
  onConfirmar,
  onCancelar,
}: DialogoConfirmarProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      onCancel={(evento) => {
        evento.preventDefault();
        onCancelar();
      }}
      onClick={(evento) => {
        // Clic en el backdrop (fuera de la tarjeta) cierra
        if (evento.target === ref.current) onCancelar();
      }}
      className="dialogo-rifa"
    >
      <div className="overflow-hidden rounded-2xl bg-crema-50 text-noche-900">
        <div className="perforado" aria-hidden="true" />
        <div className="px-6 py-6">
          <div className="flex items-start gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                variante === "peligro"
                  ? "bg-rojo-500/15 text-rojo-500"
                  : "bg-dorado-400/25 text-dorado-600"
              }`}
            >
              <IconoAlerta className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="font-titulo text-xl leading-tight">{titulo}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-noche-900/70">
                {mensaje}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancelar}
              className="rounded-xl border border-noche-900/20 px-5 py-2.5 text-sm font-semibold text-noche-900/70 transition-colors hover:bg-noche-900/5"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirmar}
              autoFocus
              className={
                variante === "peligro"
                  ? "rounded-xl bg-rojo-500 px-5 py-2.5 text-sm font-semibold text-crema-50 transition-colors hover:bg-rojo-400"
                  : "btn-dorado !px-5 !py-2.5 text-sm"
              }
            >
              {textoConfirmar}
            </button>
          </div>
        </div>
        <div className="perforado" aria-hidden="true" />
      </div>
    </dialog>
  );
}
