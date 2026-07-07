"use client";

import { useEffect, useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/client";
import type { CasillaTablero } from "@/lib/types";

const INTERVALO_REFRESCO_MS = 10_000;

/**
 * Mantiene el tablero al día sin recargar la página:
 * refresca cada 10 segundos y al volver a la pestaña.
 * Si un refresco falla, conserva el último estado conocido y reintenta luego.
 */
export function usarTableroEnVivo(inicial: CasillaTablero[]): CasillaTablero[] {
  const [casillas, setCasillas] = useState<CasillaTablero[]>(inicial);

  useEffect(() => {
    // Si el bundle quedó sin las variables públicas (p. ej. un build sin
    // build-args), el tablero funciona igual: solo pierde el refresco en vivo.
    let supabase: ReturnType<typeof crearClienteNavegador>;
    try {
      supabase = crearClienteNavegador();
    } catch (error: unknown) {
      console.error("Tablero sin refresco automático:", error);
      return;
    }
    let activo = true;

    const refrescar = async () => {
      const { data, error } = await supabase
        .from("tablero")
        .select("raffle_id, numero, estado, reservado_hasta")
        .order("numero", { ascending: true });
      if (!activo) return;
      if (error) {
        console.error("No se pudo refrescar el tablero:", error.message);
        return;
      }
      setCasillas(data as CasillaTablero[]);
    };

    const intervalo = setInterval(() => void refrescar(), INTERVALO_REFRESCO_MS);
    const alCambiarVisibilidad = () => {
      if (document.visibilityState === "visible") void refrescar();
    };
    document.addEventListener("visibilitychange", alCambiarVisibilidad);

    return () => {
      activo = false;
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
    };
  }, []);

  return casillas;
}
