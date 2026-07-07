"use client";

import { useState } from "react";
import { IconoCopiar, IconoListo } from "@/components/decoracion/Iconos";

interface BotonCopiarProps {
  /** Texto a copiar. Si se omite, copia la URL actual (enlace de la boleta). */
  valor?: string;
  etiqueta: string;
  /** "clara" para fondos crema, "oscura" para fondos azul noche. */
  apariencia?: "clara" | "oscura";
  className?: string;
}

const ESTILOS: Record<NonNullable<BotonCopiarProps["apariencia"]>, string> = {
  clara:
    "border-noche-900/25 text-noche-900 hover:bg-noche-900/5 focus-visible:outline-noche-900/50",
  oscura:
    "border-noche-600 text-crema-50 hover:border-dorado-400 hover:text-dorado-300 focus-visible:outline-dorado-400",
};

export function BotonCopiar({
  valor,
  etiqueta,
  apariencia = "clara",
  className = "",
}: BotonCopiarProps) {
  const [copiado, setCopiado] = useState(false);

  const alCopiar = async () => {
    try {
      await navigator.clipboard.writeText(valor ?? window.location.href);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Portapapeles bloqueado por el navegador: el usuario puede copiar manualmente.
    }
  };

  return (
    <button
      type="button"
      onClick={alCopiar}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${ESTILOS[apariencia]} ${className}`}
    >
      {copiado ? (
        <IconoListo className="h-3.5 w-3.5" />
      ) : (
        <IconoCopiar className="h-3.5 w-3.5" />
      )}
      {copiado ? "¡Copiado!" : etiqueta}
    </button>
  );
}
