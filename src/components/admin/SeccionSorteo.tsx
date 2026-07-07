import { BotonAccion } from "@/components/admin/BotonAccion";
import { FormularioGanador } from "@/components/admin/FormularioGanador";
import { IconoWhatsApp } from "@/components/decoracion/Iconos";
import {
  accionCerrarRifa,
  accionReabrirRifa,
  accionRegistrarGanador,
} from "@/lib/acciones/admin";
import type { InfoGanador } from "@/lib/datos/ganador";
import { dosDigitos, formatearFechaLarga } from "@/lib/formato";
import type { RifaPublica } from "@/lib/types";

interface SeccionSorteoProps {
  rifa: RifaPublica;
  ganador: InfoGanador | null;
}

/** Control del cierre de ventas y del número ganador. */
export function SeccionSorteo({ rifa, ganador }: SeccionSorteoProps) {
  const activa = rifa.estado === "activa";

  return (
    <section className="rounded-2xl border border-noche-800 bg-noche-900/50 p-5">
      <h2 className="font-titulo text-lg text-crema-50">Sorteo y cierre</h2>
      <p className="mt-1 max-w-2xl text-sm text-noche-300">
        El {formatearFechaLarga(rifa.fecha_sorteo).toLowerCase()} juega la
        Lotería de Boyacá: cierra las ventas antes del sorteo y registra las 2
        últimas cifras del premio mayor. La página pública mostrará el
        resultado al instante. La venta manual sigue funcionando con las
        ventas cerradas (para regularizar pagos atrasados).
      </p>

      {/* Estado de ventas */}
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${
            activa
              ? "border-dorado-500/50 text-dorado-300"
              : "border-rojo-500/50 text-rojo-400"
          }`}
        >
          ● {activa ? "Ventas abiertas" : "Ventas cerradas"}
        </span>
        {activa ? (
          <BotonAccion
            accion={accionCerrarRifa}
            campos={{ raffleId: rifa.id }}
            etiqueta="Cerrar ventas"
            etiquetaPendiente="Cerrando…"
            variante="peligro"
            confirmacion="¿Cerrar las ventas? Nadie podrá reservar ni comprar desde la página. Puedes reabrir cuando quieras, y la venta manual te sigue funcionando."
          />
        ) : (
          <BotonAccion
            accion={accionReabrirRifa}
            campos={{ raffleId: rifa.id }}
            etiqueta="Reabrir ventas"
            etiquetaPendiente="Reabriendo…"
            variante="sutil"
            confirmacion="¿Reabrir las ventas? El tablero vuelve a estar disponible para todos."
          />
        )}
      </div>

      {/* Ganador */}
      <div className="mt-6 border-t border-noche-800 pt-5">
        {ganador === null ? (
          <>
            <p className="text-sm font-semibold text-crema-50">
              Registrar el número ganador
            </p>
            <FormularioGanador raffleId={rifa.id} />
            {activa && (
              <p className="mt-2 text-xs text-noche-400">
                Consejo: cierra las ventas primero. El ganador solo se muestra
                al público cuando las ventas están cerradas.
              </p>
            )}
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-noche-300">
                🏆 NÚMERO GANADOR
              </p>
              <p className="font-titulo text-4xl text-dorado-400">
                {dosDigitos(ganador.numero)}
              </p>
            </div>
            <div className="min-w-0 flex-1">
              {ganador.vendido && ganador.nombre ? (
                <>
                  <p className="font-semibold text-crema-50">{ganador.nombre}</p>
                  {ganador.whatsapp && (
                    <a
                      href={`https://wa.me/57${ganador.whatsapp}?text=${encodeURIComponent(
                        `¡Felicidades! Tu número ${dosDigitos(ganador.numero)} ganó la rifa Viaja por Colombia 🎉`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-dorado-300 underline decoration-dorado-600 underline-offset-2 hover:text-dorado-400"
                    >
                      <IconoWhatsApp className="h-4 w-4" />
                      Avisarle por WhatsApp
                    </a>
                  )}
                </>
              ) : (
                <p className="text-sm text-noche-300">
                  Ese número no fue vendido: nadie lo reclama.
                </p>
              )}
            </div>
            <BotonAccion
              accion={accionRegistrarGanador}
              campos={{ raffleId: rifa.id, numero: "" }}
              etiqueta="Quitar ganador"
              variante="peligro"
              confirmacion="¿Quitar el ganador registrado? Se borra del anuncio público (el historial lo conserva)."
            />
          </div>
        )}
      </div>
    </section>
  );
}
