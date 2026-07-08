"use client";

import { useActionState, useRef, useState, type ReactNode } from "react";
import type { EstadoAdmin } from "@/lib/acciones/admin";
import { BotonCopiar } from "@/components/boleta/BotonCopiar";
import { DialogoConfirmar } from "./DialogoConfirmar";

interface BotonAccionProps {
  accion: (estado: EstadoAdmin, formData: FormData) => Promise<EstadoAdmin>;
  /** Campos ocultos que necesita la acción (ticketId, motivo, etc.) */
  campos?: Record<string, string>;
  etiqueta: string;
  etiquetaPendiente?: string;
  variante?: "dorado" | "peligro" | "sutil";
  /** Ícono opcional a la izquierda del texto */
  icono?: ReactNode;
  /** Si se define, abre un diálogo de confirmación de la marca antes de enviar. */
  confirmacion?: string;
  /** Título del diálogo de confirmación (por defecto usa la etiqueta) */
  tituloConfirmacion?: string;
  className?: string;
}

const ESTADO_INICIAL: EstadoAdmin = {};

const VARIANTES: Record<NonNullable<BotonAccionProps["variante"]>, string> = {
  dorado: "btn-dorado !px-4 !py-2 text-sm",
  peligro:
    "inline-flex items-center gap-1.5 rounded-lg border border-rojo-500/50 px-4 py-2 text-sm font-semibold text-rojo-400 transition-colors hover:bg-rojo-500/10 disabled:opacity-60",
  sutil:
    "inline-flex items-center gap-1.5 rounded-lg border border-noche-600 px-4 py-2 text-sm font-semibold text-crema-50 transition-colors hover:border-dorado-400 hover:text-dorado-300 disabled:opacity-60",
};

/** Botón que ejecuta una acción de admin y muestra el resultado en línea. */
export function BotonAccion({
  accion,
  campos = {},
  etiqueta,
  etiquetaPendiente = "Un momento…",
  variante = "sutil",
  icono,
  confirmacion,
  tituloConfirmacion,
  className = "",
}: BotonAccionProps) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const confirmarYEnviar = () => {
    setDialogoAbierto(false);
    formRef.current?.requestSubmit();
  };

  return (
    <>
      <form
        ref={formRef}
        action={enviar}
        className={`inline-block ${className}`}
        onSubmit={(evento) => {
          // Con confirmación pendiente: frenar y abrir el diálogo bonito.
          if (confirmacion && !dialogoAbierto) {
            evento.preventDefault();
            setDialogoAbierto(true);
          }
        }}
      >
        {Object.entries(campos).map(([nombre, valor]) => (
          <input key={nombre} type="hidden" name={nombre} value={valor} />
        ))}
        <button type="submit" disabled={pendiente} className={VARIANTES[variante]}>
          {!pendiente && icono}
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

      {confirmacion && (
        <DialogoConfirmar
          abierto={dialogoAbierto}
          titulo={tituloConfirmacion ?? etiqueta}
          mensaje={confirmacion}
          textoConfirmar={etiqueta}
          variante={variante === "peligro" ? "peligro" : "dorado"}
          onConfirmar={confirmarYEnviar}
          onCancelar={() => setDialogoAbierto(false)}
        />
      )}
    </>
  );
}
