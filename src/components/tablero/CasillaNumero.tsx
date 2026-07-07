"use client";

import { dosDigitos } from "@/lib/formato";
import type { TicketEstado } from "@/lib/types";

interface CasillaNumeroProps {
  numero: number;
  estado: TicketEstado;
  seleccionado: boolean;
  onSeleccionar: (numero: number) => void;
}

const ESTILO_BASE =
  "relative flex aspect-square select-none items-center justify-center rounded-lg border font-titulo text-base transition-all duration-150 sm:text-lg";

const ESTILO_DISPONIBLE =
  "cursor-pointer border-noche-600 bg-noche-900 text-dorado-400 hover:-translate-y-0.5 hover:border-dorado-400 hover:bg-noche-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dorado-400";

const ESTILO_SELECCIONADO =
  "-translate-y-0.5 border-dorado-300 bg-dorado-400 text-noche-950 shadow-lg shadow-dorado-500/40";

const ESTILO_APARTADO = "border-noche-800 bg-noche-900/50 text-noche-400/70";

const ESTILO_VENDIDO = "border-rojo-500/30 bg-rojo-500/10 text-noche-400/60";

export function CasillaNumero({
  numero,
  estado,
  seleccionado,
  onSeleccionar,
}: CasillaNumeroProps) {
  const disponible = estado === "disponible";
  const vendido = estado === "vendido";
  const apartado = !disponible && !vendido; // reservado | en_revision

  const estiloEstado = seleccionado
    ? ESTILO_SELECCIONADO
    : disponible
      ? ESTILO_DISPONIBLE
      : vendido
        ? ESTILO_VENDIDO
        : ESTILO_APARTADO;

  const etiqueta = seleccionado
    ? "seleccionado"
    : disponible
      ? "disponible"
      : vendido
        ? "vendido"
        : "apartado";

  return (
    <button
      type="button"
      disabled={!disponible}
      onClick={() => onSeleccionar(numero)}
      aria-label={`Número ${dosDigitos(numero)}: ${etiqueta}`}
      aria-pressed={seleccionado}
      className={`${ESTILO_BASE} ${estiloEstado}`}
    >
      <span
        className={
          vendido ? "line-through decoration-rojo-400/70 decoration-2" : undefined
        }
      >
        {dosDigitos(numero)}
      </span>
      {apartado && <RelojEsquina />}
    </button>
  );
}

/** Relojito en la esquina: el número está apartado temporalmente. */
function RelojEsquina() {
  return (
    <svg
      viewBox="0 0 12 12"
      className="absolute right-1 top-1 h-2.5 w-2.5 text-dorado-600/80"
      aria-hidden="true"
    >
      <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M6 3.4V6l1.8 1.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
