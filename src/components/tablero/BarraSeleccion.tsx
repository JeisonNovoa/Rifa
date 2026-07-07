"use client";

import { useEffect, useState } from "react";
import { dosDigitos, formatearPesos } from "@/lib/formato";
import { FormularioReserva } from "./FormularioReserva";

interface BarraSeleccionProps {
  numero: number | null;
  raffleId: string;
  precio: number;
  minutosReserva: number;
  onQuitar: () => void;
}

/**
 * Barra fija inferior con forma de boleta perforada (como la del flyer).
 * Aparece al seleccionar un número; con "Apartarlo" se despliega el
 * formulario de reserva dentro de la misma boleta.
 */
export function BarraSeleccion({
  numero,
  raffleId,
  precio,
  minutosReserva,
  onQuitar,
}: BarraSeleccionProps) {
  const visible = numero !== null;
  const [formularioAbierto, setFormularioAbierto] = useState(false);

  // Al cambiar de número (o quitar la selección) se recoge el formulario.
  useEffect(() => {
    setFormularioAbierto(false);
  }, [numero]);

  return (
    <div
      aria-hidden={!visible}
      inert={!visible || undefined}
      className={`fixed inset-x-0 bottom-0 z-50 px-4 pb-4 transition-transform duration-300 [transition-timing-function:var(--ease-salida)] sm:pb-6 ${
        visible ? "translate-y-0" : "translate-y-[130%]"
      }`}
    >
      <div className="mx-auto max-w-xl overflow-hidden rounded-2xl bg-crema-50 text-noche-900 shadow-2xl shadow-noche-950/70">
        <div className="perforado" aria-hidden="true" />
        <div className="flex items-center gap-3 p-3 pl-4 sm:gap-4 sm:p-4 sm:pl-5">
          {/* Talón del boleto */}
          <div className="border-r-2 border-dashed border-noche-900/20 pr-3 text-center sm:pr-4">
            <p className="font-titulo text-[10px] tracking-[0.2em] text-rojo-500">
              N.º
            </p>
            <p className="font-titulo text-3xl leading-none text-rojo-500">
              {numero === null ? "--" : dosDigitos(numero)}
            </p>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold leading-tight">
              Tu número<span className="hidden sm:inline"> de la suerte</span>
            </p>
            <p className="mt-0.5 text-xs text-noche-900/60 sm:text-sm">
              {formatearPesos(precio)} · se aparta {minutosReserva} min
            </p>
          </div>

          {!formularioAbierto && (
            <button
              type="button"
              onClick={() => setFormularioAbierto(true)}
              className="btn-dorado shrink-0 !px-4 !py-2.5 text-sm sm:!px-5"
            >
              Apartarlo
            </button>
          )}
          <button
            type="button"
            onClick={onQuitar}
            aria-label="Quitar selección"
            className="shrink-0 rounded-full p-1.5 text-noche-900/50 transition-colors hover:bg-noche-900/10 hover:text-noche-900"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {formularioAbierto && numero !== null && (
          <FormularioReserva
            raffleId={raffleId}
            numero={numero}
            onCancelar={() => setFormularioAbierto(false)}
          />
        )}
      </div>
    </div>
  );
}
