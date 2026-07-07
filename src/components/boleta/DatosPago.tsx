import { BotonCopiar } from "@/components/boleta/BotonCopiar";
import { IconoCelular, IconoLlave } from "@/components/decoracion/Iconos";
import { formatearPesos } from "@/lib/formato";
import type { RifaPublica } from "@/lib/types";

interface DatosPagoProps {
  rifa: RifaPublica;
  className?: string;
}

/**
 * Boleta crema con los datos para pagar por Nequi.
 * IMPORTANTE: aquí solo se MUESTRAN los datos del organizador.
 * Jamás se piden claves ni datos bancarios del comprador.
 */
export function DatosPago({ rifa, className = "" }: DatosPagoProps) {
  return (
    <section
      aria-labelledby="titulo-pago"
      className={`overflow-hidden rounded-2xl bg-crema-50 text-noche-900 shadow-xl shadow-noche-900/40 ${className}`}
    >
      <div className="perforado" aria-hidden="true" />
      <div className="px-5 py-6 sm:px-7">
        <p className="font-titulo text-xs tracking-[0.28em] text-rojo-500">
          PASO 1 · PAGA POR NEQUI
        </p>
        <p id="titulo-pago" className="mt-2 font-titulo text-3xl">
          Envía {formatearPesos(rifa.precio_por_numero)}
        </p>

        {/* Método recomendado: llave Bre-B (sirve desde cualquier banco) */}
        <div className="mt-5 rounded-xl border border-noche-900/15 bg-white/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-noche-900/60">
                <IconoLlave className="h-4 w-4 text-dorado-600" />
                LLAVE BRE-B · RECOMENDADO
              </p>
              <p className="mt-1 truncate font-titulo text-2xl tracking-wider">
                {rifa.nequi_llave ?? "Por definir"}
              </p>
            </div>
            {rifa.nequi_llave && (
              <BotonCopiar valor={rifa.nequi_llave} etiqueta="Copiar llave" />
            )}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-noche-900/60">
            Desde Nequi, Bancolombia o tu banco: busca{" "}
            <strong className="font-semibold text-noche-900">
              Bre-B / Enviar con llave
            </strong>
            , pega la llave y envía el valor exacto.
          </p>
        </div>

        <div className="my-4 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-noche-900/10" />
          <span className="text-xs font-medium text-noche-900/40">
            o si prefieres
          </span>
          <span className="h-px flex-1 bg-noche-900/10" />
        </div>

        <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
          {/* Espacio reservado para el código QR de Nequi */}
          <div className="mx-auto flex aspect-square w-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-noche-900/25 bg-white/40 text-center">
            {rifa.nequi_qr_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={rifa.nequi_qr_url}
                alt="Código QR de Nequi para pagar la boleta"
                className="h-full w-full rounded-xl object-contain p-2"
              />
            ) : (
              <>
                <QrIcono />
                <p className="mt-2 px-3 text-xs font-medium leading-snug text-noche-900/50">
                  Aquí irá el código QR de Nequi
                </p>
              </>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold tracking-wide text-noche-900/60">
              ESCANEA EL QR
            </p>
            <p className="mt-1 text-xs leading-relaxed text-noche-900/60">
              Abre tu app bancaria, escanea y paga de una.
            </p>

            <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-noche-900/60">
              <IconoCelular className="h-4 w-4 text-dorado-600" />
              NEQUI CLÁSICO
            </p>
            <div className="mt-1 flex items-center gap-2.5">
              <p className="font-titulo text-xl tracking-wider">
                {rifa.nequi_numero ?? "Por definir"}
              </p>
              {rifa.nequi_numero && (
                <BotonCopiar valor={rifa.nequi_numero} etiqueta="Copiar" />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="perforado" aria-hidden="true" />
    </section>
  );
}

function QrIcono() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9 text-noche-900/40" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 3h8v8H3V3Zm2 2v4h4V5H5Zm8-2h8v8h-8V3Zm2 2v4h4V5h-4ZM3 13h8v8H3v-8Zm2 2v4h4v-4H5Zm11-2h2v2h-2v-2Zm-3 3h2v2h-2v-2Zm3 0h2v3h3v-3h2v5h-4v3h-3v-8Zm5 6v2h2v-2h-2Z"
      />
    </svg>
  );
}
