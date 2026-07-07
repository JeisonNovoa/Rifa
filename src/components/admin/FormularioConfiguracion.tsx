"use client";

import { useActionState } from "react";
import {
  accionGuardarConfiguracion,
  accionQuitarQr,
  accionSubirQr,
  type EstadoAdmin,
} from "@/lib/acciones/admin";
import type { RifaPublica } from "@/lib/types";

interface FormularioConfiguracionProps {
  rifa: RifaPublica;
}

const ESTADO_INICIAL: EstadoAdmin = {};

const ESTILO_INPUT =
  "w-full rounded-lg border border-noche-600 bg-noche-900/60 px-3 py-2.5 text-sm text-crema-50 placeholder:text-noche-400 focus:border-dorado-400 focus:outline-none disabled:opacity-60";

const ETIQUETA = "mb-1 block text-xs font-semibold text-noche-300";

/** Configuración editable de la rifa: datos de pago, minutos de reserva y QR. */
export function FormularioConfiguracion({ rifa }: FormularioConfiguracionProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <DatosDePago rifa={rifa} />
      <GestionQr rifa={rifa} />
    </div>
  );
}

function DatosDePago({ rifa }: { rifa: RifaPublica }) {
  const [estado, enviar, pendiente] = useActionState(
    accionGuardarConfiguracion,
    ESTADO_INICIAL
  );

  return (
    <section className="rounded-2xl border border-noche-800 bg-noche-900/50 p-5">
      <h2 className="font-titulo text-lg text-crema-50">Datos de pago y reserva</h2>
      <p className="mt-1 text-sm text-noche-300">
        Se actualizan al instante en la página pública, sin tocar código.
      </p>

      <form action={enviar} className="mt-4 space-y-4">
        <input type="hidden" name="raffleId" value={rifa.id} />

        <label className="block">
          <span className={ETIQUETA}>Llave Bre-B</span>
          <input
            name="llave"
            defaultValue={rifa.nequi_llave ?? ""}
            maxLength={60}
            placeholder="Celular, cédula o llave alfanumérica"
            disabled={pendiente}
            className={ESTILO_INPUT}
          />
        </label>

        <label className="block">
          <span className={ETIQUETA}>Número Nequi (transferencia clásica)</span>
          <input
            name="numeroNequi"
            defaultValue={rifa.nequi_numero ?? ""}
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="3001234567"
            disabled={pendiente}
            className={ESTILO_INPUT}
          />
        </label>

        <label className="block">
          <span className={ETIQUETA}>Minutos de reserva (5 a 120)</span>
          <input
            name="minutos"
            defaultValue={rifa.minutos_reserva}
            type="number"
            required
            min={5}
            max={120}
            disabled={pendiente}
            className={ESTILO_INPUT}
          />
        </label>

        <button
          type="submit"
          disabled={pendiente}
          className="btn-dorado !px-5 !py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendiente ? "Guardando…" : "Guardar cambios"}
        </button>

        {estado.error && (
          <p role="alert" className="text-sm font-medium text-rojo-400">
            {estado.error}
          </p>
        )}
        {estado.exito && (
          <p className="text-sm font-medium text-dorado-300">{estado.exito}</p>
        )}
      </form>

      <p className="mt-4 border-t border-noche-800 pt-3 text-xs text-noche-400">
        El precio de la boleta no se cambia desde aquí a propósito: cambiarlo
        con la rifa andando genera reclamos de quienes ya pagaron.
      </p>
    </section>
  );
}

function GestionQr({ rifa }: { rifa: RifaPublica }) {
  const [estadoSubir, enviarQr, subiendo] = useActionState(
    accionSubirQr,
    ESTADO_INICIAL
  );
  const [estadoQuitar, quitarQr, quitando] = useActionState(
    accionQuitarQr,
    ESTADO_INICIAL
  );

  return (
    <section className="rounded-2xl border border-noche-800 bg-noche-900/50 p-5">
      <h2 className="font-titulo text-lg text-crema-50">Código QR de Nequi</h2>
      <p className="mt-1 text-sm text-noche-300">
        Se muestra en la pantalla de pago. Genéralo en tu app de Nequi
        (símbolo $ → Usa tu QR → compartir como imagen) y súbelo aquí.
      </p>

      <div className="mt-4 flex flex-wrap items-start gap-5">
        <div className="flex aspect-square w-36 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-noche-600 bg-noche-950/50">
          {rifa.nequi_qr_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={rifa.nequi_qr_url}
              alt="QR de Nequi actual"
              className="h-full w-full object-contain p-1.5"
            />
          ) : (
            <p className="px-3 text-center text-xs text-noche-400">
              Aún no has subido el QR
            </p>
          )}
        </div>

        <div className="min-w-52 flex-1 space-y-4">
          <form action={enviarQr}>
            <input type="hidden" name="raffleId" value={rifa.id} />
            <label className="block">
              <span className={ETIQUETA}>
                {rifa.nequi_qr_url ? "Reemplazar imagen" : "Subir imagen"} (máx. 2 MB)
              </span>
              <input
                type="file"
                name="archivo"
                required
                accept="image/jpeg,image/png,image/webp"
                disabled={subiendo}
                className="block w-full text-sm text-noche-300 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-dorado-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-noche-950 hover:file:bg-dorado-300"
              />
            </label>
            <button
              type="submit"
              disabled={subiendo}
              className="btn-dorado mt-3 !px-5 !py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {subiendo ? "Subiendo…" : "Subir QR"}
            </button>
            {estadoSubir.error && (
              <p role="alert" className="mt-2 text-sm font-medium text-rojo-400">
                {estadoSubir.error}
              </p>
            )}
            {estadoSubir.exito && (
              <p className="mt-2 text-sm font-medium text-dorado-300">
                {estadoSubir.exito}
              </p>
            )}
          </form>

          {rifa.nequi_qr_url && (
            <form
              action={quitarQr}
              onSubmit={(evento) => {
                if (!window.confirm("¿Quitar el QR de la pantalla de pago?")) {
                  evento.preventDefault();
                }
              }}
            >
              <input type="hidden" name="raffleId" value={rifa.id} />
              <button
                type="submit"
                disabled={quitando}
                className="rounded-lg border border-rojo-500/50 px-4 py-2 text-sm font-semibold text-rojo-400 transition-colors hover:bg-rojo-500/10 disabled:opacity-60"
              >
                {quitando ? "Quitando…" : "Quitar QR"}
              </button>
              {estadoQuitar.exito && (
                <p className="mt-2 text-sm font-medium text-dorado-300">
                  {estadoQuitar.exito}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
