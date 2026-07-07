"use client";

import { useEffect, useState } from "react";
import { accionRechazarPago } from "@/lib/acciones/admin";
import { dosDigitos } from "@/lib/formato";
import { BotonAccion } from "./BotonAccion";

interface FilaReservaProps {
  ticketId: string;
  numero: number;
  nombre: string | null;
  whatsapp: string | null;
  reservadoHasta: string;
}

/** Fila de una reserva activa con cuenta regresiva y liberación manual. */
export function FilaReserva({
  ticketId,
  numero,
  nombre,
  whatsapp,
  reservadoHasta,
}: FilaReservaProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-noche-800 bg-noche-900/50 px-4 py-3">
      <span className="font-titulo text-xl text-dorado-400">
        {dosDigitos(numero)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-crema-50">
          {nombre ?? "Sin nombre"}
        </p>
        {whatsapp && (
          <a
            href={`https://wa.me/57${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-noche-300 underline decoration-noche-600 underline-offset-2 hover:text-crema-50"
          >
            {whatsapp} ↗
          </a>
        )}
      </div>
      <MiniCuentaRegresiva hasta={reservadoHasta} />
      <BotonAccion
        accion={accionRechazarPago}
        campos={{ ticketId, motivo: "liberada manualmente por el admin" }}
        etiqueta="Liberar"
        etiquetaPendiente="Liberando…"
        variante="peligro"
        confirmacion={`¿Liberar el ${dosDigitos(numero)} ya mismo? La persona perderá su reserva.`}
      />
    </div>
  );
}

function MiniCuentaRegresiva({ hasta }: { hasta: string }) {
  const [ahora, setAhora] = useState<number | null>(null);

  useEffect(() => {
    setAhora(Date.now());
    const intervalo = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  const restante =
    ahora === null ? null : Math.max(0, new Date(hasta).getTime() - ahora);
  const texto =
    restante === null
      ? "--:--"
      : `${Math.floor(restante / 60_000)
          .toString()
          .padStart(2, "0")}:${Math.floor((restante % 60_000) / 1000)
          .toString()
          .padStart(2, "0")}`;

  return (
    <span
      className={`font-titulo text-sm tabular-nums ${
        restante === 0 ? "text-rojo-400" : "text-noche-300"
      }`}
      title="Tiempo restante de la reserva"
    >
      {restante === 0 ? "vencida" : texto}
    </span>
  );
}
