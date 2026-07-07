"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface CuentaRegresivaProps {
  /** Timestamp ISO de cuándo vence la reserva */
  hasta: string;
  className?: string;
}

/**
 * Cuenta regresiva de la reserva. Es solo informativa: la verdad la tiene
 * la base de datos. Al llegar a cero refresca la página para que el
 * servidor muestre el estado real (vencida).
 */
export function CuentaRegresiva({ hasta, className = "" }: CuentaRegresivaProps) {
  const router = useRouter();
  // null hasta montar en el cliente: evita desfase entre servidor y navegador.
  const [ahora, setAhora] = useState<number | null>(null);
  const yaRefresco = useRef(false);

  useEffect(() => {
    setAhora(Date.now());
    const intervalo = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  const limite = new Date(hasta).getTime();
  const restante = ahora === null ? null : Math.max(0, limite - ahora);

  useEffect(() => {
    if (restante === 0 && !yaRefresco.current) {
      yaRefresco.current = true;
      const temporizador = setTimeout(() => router.refresh(), 1200);
      return () => clearTimeout(temporizador);
    }
  }, [restante, router]);

  const texto =
    restante === null
      ? "--:--"
      : `${Math.floor(restante / 60_000)
          .toString()
          .padStart(2, "0")}:${Math.floor((restante % 60_000) / 1000)
          .toString()
          .padStart(2, "0")}`;

  const agotado = restante === 0;

  return (
    <div
      className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-2 ${
        agotado
          ? "border-rojo-500/60 bg-rojo-500/10"
          : "border-dorado-500/50 bg-noche-900/70"
      } ${className}`}
    >
      <RelojIcono />
      {agotado ? (
        <span className="text-sm font-medium text-rojo-400">
          Se acabó el tiempo…
        </span>
      ) : (
        <span className="text-sm text-noche-300">
          Tu reserva vence en{" "}
          <strong className="font-titulo text-lg tabular-nums text-dorado-400">
            {texto}
          </strong>
        </span>
      )}
    </div>
  );
}

function RelojIcono() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 text-dorado-400" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M8 4.5V8l2.4 1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
