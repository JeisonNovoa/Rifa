"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconoBoleto } from "@/components/decoracion/Iconos";
import { leerBoletasGuardadas, type BoletaGuardada } from "@/lib/boletas-guardadas";
import { dosDigitos } from "@/lib/formato";

/**
 * Recupera las boletas que la persona apartó en este dispositivo
 * (guardadas en localStorage) y las muestra para retomar el pago.
 * Si no hay ninguna, no renderiza nada.
 */
export function MisBoletas() {
  const [boletas, setBoletas] = useState<BoletaGuardada[]>([]);

  useEffect(() => {
    setBoletas(leerBoletasGuardadas());
  }, []);

  if (boletas.length === 0) return null;

  return (
    <section
      aria-label="Tus boletas guardadas"
      className="mt-8 rounded-2xl border border-dorado-500/40 bg-dorado-400/[0.06] p-4"
    >
      <p className="flex items-center gap-2 font-titulo text-sm tracking-wide text-dorado-300">
        <IconoBoleto className="h-5 w-5" />
        Tus boletas en este dispositivo
      </p>
      <p className="mt-1 text-xs text-noche-300">
        Retoma el pago o revisa el estado de tu número.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {boletas.map((boleta) => (
          <Link
            key={boleta.numero}
            href={boleta.url}
            className="inline-flex items-center gap-2 rounded-xl border border-noche-700 bg-noche-900/70 px-3 py-2 text-sm font-medium text-crema-50 transition-colors hover:border-dorado-400 hover:text-dorado-300"
          >
            <span className="font-titulo text-lg text-dorado-400">
              {dosDigitos(boleta.numero)}
            </span>
            <span className="text-xs text-noche-300">ver / pagar →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
