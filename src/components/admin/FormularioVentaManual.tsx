"use client";

import { useActionState } from "react";
import { accionVentaManual, type EstadoAdmin } from "@/lib/acciones/admin";
import { BotonCopiar } from "@/components/boleta/BotonCopiar";

interface FormularioVentaManualProps {
  raffleId: string;
}

const ESTADO_INICIAL: EstadoAdmin = {};

const ESTILO_INPUT =
  "w-full rounded-lg border border-noche-600 bg-noche-900/60 px-3 py-2.5 text-sm text-crema-50 placeholder:text-noche-400 focus:border-dorado-400 focus:outline-none disabled:opacity-60";

/**
 * Venta manual: para pagos en efectivo, acordados por WhatsApp o
 * pagos que llegaron tarde (la reserva venció pero la plata sí entró).
 * Reserva + confirma en un solo paso y entrega el enlace de la boleta.
 */
export function FormularioVentaManual({ raffleId }: FormularioVentaManualProps) {
  const [estado, enviar, pendiente] = useActionState(
    accionVentaManual,
    ESTADO_INICIAL
  );

  return (
    <section className="rounded-2xl border border-noche-800 bg-noche-900/50 p-5">
      <h2 className="font-titulo text-lg text-crema-50">Venta manual</h2>
      <p className="mt-1 text-sm text-noche-300">
        Para efectivo, acuerdos por WhatsApp o pagos que llegaron tarde. El
        número queda vendido de una y te damos el enlace de la boleta para
        compartírselo al comprador.
      </p>

      <form action={enviar} className="mt-4">
        <input type="hidden" name="raffleId" value={raffleId} />
        <div className="grid gap-3 sm:grid-cols-[6rem_1fr_1fr_auto] sm:items-end">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-noche-300">
              Número
            </span>
            <input
              name="numero"
              type="number"
              required
              min={0}
              max={99}
              placeholder="45"
              disabled={pendiente}
              className={ESTILO_INPUT}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-noche-300">
              Nombre del comprador
            </span>
            <input
              name="nombre"
              required
              minLength={2}
              maxLength={80}
              placeholder="Nombre y apellido"
              disabled={pendiente}
              className={ESTILO_INPUT}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-noche-300">
              WhatsApp
            </span>
            <input
              name="whatsapp"
              required
              type="tel"
              inputMode="numeric"
              pattern="3[0-9]{9}"
              maxLength={10}
              placeholder="3001234567"
              disabled={pendiente}
              className={ESTILO_INPUT}
            />
          </label>
          <button
            type="submit"
            disabled={pendiente}
            className="btn-dorado !px-5 !py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendiente ? "Vendiendo…" : "Vender"}
          </button>
        </div>

        {estado.error && (
          <p role="alert" className="mt-3 text-sm font-medium text-rojo-400">
            {estado.error}
          </p>
        )}
        {estado.exito && (
          <div className="mt-3 rounded-lg border border-dorado-500/40 bg-dorado-400/5 p-3">
            <p className="text-sm font-medium text-dorado-300">{estado.exito}</p>
            {estado.enlaceBoleta && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <BotonCopiar
                  valor={estado.enlaceBoleta}
                  etiqueta="Copiar boleta del comprador"
                  apariencia="oscura"
                />
                <span className="text-xs text-noche-300">
                  Compártesela por WhatsApp: ahí ve su número confirmado.
                </span>
              </div>
            )}
          </div>
        )}
      </form>
    </section>
  );
}
