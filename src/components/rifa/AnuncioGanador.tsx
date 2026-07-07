import type { InfoGanador } from "@/lib/datos/ganador";
import { dosDigitos, formatearFechaLarga } from "@/lib/formato";

interface AnuncioGanadorProps {
  fechaSorteo: string | null;
  ganador: InfoGanador | null;
}

/**
 * Reemplaza al tablero cuando la rifa está cerrada:
 * - Sin ganador registrado: "ventas cerradas, atentos al sorteo".
 * - Con ganador: la boleta de celebración.
 */
export function AnuncioGanador({ fechaSorteo, ganador }: AnuncioGanadorProps) {
  if (ganador === null) {
    return (
      <div className="mt-6 rounded-2xl border border-dorado-500/40 bg-noche-900/60 p-6">
        <p className="font-titulo text-xl text-crema-50">Ventas cerradas</p>
        <p className="mt-2 max-w-lg leading-relaxed text-noche-300">
          El sorteo juega el{" "}
          <strong className="font-semibold text-crema-50">
            {formatearFechaLarga(fechaSorteo).toLowerCase()}
          </strong>{" "}
          con las 2 últimas cifras del premio mayor de la Lotería de Boyacá.
          El resultado se publicará aquí mismo.
        </p>
        <p className="mt-4 inline-block -rotate-2 font-script text-2xl text-dorado-400">
          ¡Mucha suerte a todos!
        </p>
      </div>
    );
  }

  return (
    <div className="revelar mt-6 overflow-hidden rounded-2xl bg-crema-50 text-noche-900 shadow-xl shadow-noche-900/40">
      <div className="perforado" aria-hidden="true" />
      <div className="px-6 py-8 text-center sm:px-8">
        <p className="font-titulo text-xs tracking-[0.28em] text-rojo-500">
          RESULTADO DEL SORTEO · LOTERÍA DE BOYACÁ
        </p>
        <p className="mt-4 font-titulo text-[10px] tracking-[0.2em] text-rojo-500">
          NÚMERO GANADOR
        </p>
        <p className="font-titulo text-8xl leading-none text-rojo-500">
          {dosDigitos(ganador.numero)}
        </p>

        {ganador.vendido && ganador.nombre ? (
          <>
            <h3 className="mt-5 font-titulo text-3xl">
              ¡Felicidades, {ganador.nombre}!
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-noche-900/70">
              Tu número tiene las 2 últimas cifras del premio mayor. El
              organizador se pondrá en contacto contigo para entregarte el
              premio: ¡a empacar maletas!
            </p>
          </>
        ) : (
          <>
            <h3 className="mt-5 font-titulo text-2xl">
              El número ganador no fue vendido
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-noche-900/70">
              Nadie tenía el {dosDigitos(ganador.numero)}. El organizador
              anunciará los siguientes pasos.
            </p>
          </>
        )}

        <p className="mt-5 inline-block -rotate-2 font-script text-2xl text-rojo-500">
          ¡Gracias a todos por hacer parte de esta aventura!
        </p>
      </div>
      <div className="perforado" aria-hidden="true" />
    </div>
  );
}
