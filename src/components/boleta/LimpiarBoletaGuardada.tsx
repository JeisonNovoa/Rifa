"use client";

import { useEffect } from "react";
import { olvidarBoleta, olvidarBoletaPorUrl } from "@/lib/boletas-guardadas";

interface LimpiarBoletaGuardadaProps {
  /** Si se conoce el número (reserva vencida) se olvida por número;
   *  si no (enlace inválido), se olvida por la URL actual. */
  numero?: number;
}

/**
 * No renderiza nada: al montarse borra de este dispositivo la boleta guardada
 * que ya no sirve (reserva vencida o enlace inválido), para que no siga
 * apareciendo en "Tus boletas en este dispositivo".
 */
export function LimpiarBoletaGuardada({ numero }: LimpiarBoletaGuardadaProps) {
  useEffect(() => {
    if (typeof numero === "number") {
      olvidarBoleta(numero);
      return;
    }
    olvidarBoletaPorUrl(window.location.pathname + window.location.search);
  }, [numero]);

  return null;
}
