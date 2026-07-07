"use client";

import { useActionState, useState } from "react";
import {
  accionSubirComprobante,
  type EstadoAccion,
} from "@/lib/acciones/reservas";
import {
  COMPROBANTE_MAX_BYTES,
  COMPROBANTE_TIPOS_PERMITIDOS,
  MENSAJES_COMPROBANTE,
} from "@/lib/constants";

interface FormularioComprobanteProps {
  ticketId: string;
  token: string;
  /** Título contextual (cambia si es primera subida o corrección) */
  titulo?: string;
  className?: string;
}

const ESTADO_INICIAL: EstadoAccion = {};

export function FormularioComprobante({
  ticketId,
  token,
  titulo = "PASO 2 · SUBE TU COMPROBANTE",
  className = "",
}: FormularioComprobanteProps) {
  const [estado, enviar, pendiente] = useActionState(
    accionSubirComprobante,
    ESTADO_INICIAL
  );
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const alElegirArchivo = (evento: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = evento.target.files?.[0];
    setErrorLocal(null);
    setNombreArchivo(null);
    if (!archivo) return;
    if (archivo.size > COMPROBANTE_MAX_BYTES) {
      setErrorLocal(MENSAJES_COMPROBANTE.muy_pesado);
      return;
    }
    if (!(COMPROBANTE_TIPOS_PERMITIDOS as readonly string[]).includes(archivo.type)) {
      setErrorLocal(MENSAJES_COMPROBANTE.formato);
      return;
    }
    setNombreArchivo(archivo.name);
  };

  return (
    <section
      className={`rounded-2xl border border-noche-800 bg-noche-900/60 p-5 ${className}`}
    >
      <p className="font-titulo text-xs tracking-[0.28em] text-dorado-400">
        {titulo}
      </p>

      <form action={enviar} className="mt-3">
        <input type="hidden" name="ticketId" value={ticketId} />
        <input type="hidden" name="token" value={token} />

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-noche-600 px-4 py-6 text-center transition-colors hover:border-dorado-400">
          <input
            type="file"
            name="archivo"
            required
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={alElegirArchivo}
            disabled={pendiente}
          />
          <SubirIcono />
          <span className="mt-2 text-sm font-medium text-crema-50">
            {nombreArchivo ?? "Toca para elegir la captura del pago"}
          </span>
          <span className="mt-1 text-xs text-noche-400">
            JPG, PNG o WebP · máx. 5 MB
          </span>
        </label>

        {(errorLocal ?? estado.error) && (
          <p role="alert" className="mt-2 text-sm font-medium text-rojo-400">
            {errorLocal ?? estado.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pendiente || errorLocal !== null}
          className="btn-dorado mt-4 w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendiente ? "Enviando…" : "Enviar comprobante"}
        </button>
      </form>
    </section>
  );
}

function SubirIcono() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 text-dorado-500" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 16V5m0 0 4 4m-4-4L8 9M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16"
      />
    </svg>
  );
}
