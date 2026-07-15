import { IconoListo } from "@/components/decoracion/Iconos";
import { DESTINOS, INCLUYE_PREMIO, type Destino } from "@/lib/contenido";

/** Los 2 destinos del flyer: el ganador elige uno. */
export function Destinos() {
  return (
    // relative z-10: por delante del avión volador cuando pasa "al fondo"
    <section
      aria-labelledby="titulo-destinos"
      className="revelar relative z-10 mt-16 sm:mt-24"
    >
      <p className="font-titulo text-xs tracking-[0.3em] text-dorado-400">
        EL PREMIO
      </p>
      <h2
        id="titulo-destinos"
        className="mt-2 font-titulo text-3xl text-crema-50 sm:text-4xl"
      >
        El ganador <span className="trazo-dorado">elige</span> su destino
      </h2>

      <ol className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-6">
        {DESTINOS.map((destino, indice) => (
          <TarjetaDestino
            key={destino.nombre}
            destino={destino}
            opcion={indice + 1}
          />
        ))}
      </ol>

      {/* Sellos del flyer: qué incluye */}
      <ul className="revelar mt-6 flex flex-wrap gap-x-5 gap-y-2">
        {INCLUYE_PREMIO.map((item) => (
          <li
            key={item}
            className="flex items-center gap-1.5 text-xs font-medium text-noche-300"
          >
            <IconoListo className="h-3.5 w-3.5 text-dorado-500" />
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-noche-400">
        Itinerario de referencia, sujeto a condiciones climáticas y del caudal
        de los ríos.
      </p>
    </section>
  );
}

function TarjetaDestino({ destino, opcion }: { destino: Destino; opcion: number }) {
  return (
    <li className="tarjeta-destino">
      {/* Wrapper interno: el stagger va AQUÍ, no en el <li> que el avión mide. */}
      <div className={`revelar-item revelar-item--${opcion} p-5`}>
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dorado-500/50 bg-dorado-400/10 font-titulo text-sm text-dorado-400"
          >
            {opcion}
          </span>
          <p className="font-titulo text-xs tracking-[0.25em] text-dorado-400">
            OPCIÓN {opcion}
          </p>
        </div>
        <h3 className="mt-3 font-titulo text-2xl tracking-wide text-crema-50">
          {destino.nombre}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-noche-300">
          {destino.descripcion}
        </p>

        <ul className="mt-4 space-y-1.5">
          {destino.atractivos.map((atractivo) => (
            <li
              key={atractivo}
              className="flex items-start gap-2 text-sm text-noche-300"
            >
              <IconoListo className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dorado-500" />
              {atractivo}
            </li>
          ))}
        </ul>

        {/* Itinerario día a día, expandible para no saturar */}
        <details className="group mt-4 border-t border-noche-800 pt-3">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-dorado-300 transition-colors hover:text-dorado-400">
            Ver itinerario del viaje
            <svg
              viewBox="0 0 16 16"
              className="h-4 w-4 transition-transform group-open:rotate-180"
              aria-hidden="true"
            >
              <path
                d="M4 6l4 4 4-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </summary>
          <ol className="mt-3 space-y-3 border-l border-dashed border-dorado-500/30 pl-4">
            {destino.itinerario.map((etapa) => (
              <li key={etapa.dia} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-[1.32rem] top-1 h-2 w-2 rounded-full bg-dorado-500/60"
                />
                <p className="font-titulo text-sm tracking-wide text-dorado-400">
                  {etapa.dia}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-noche-300">
                  {etapa.plan}
                </p>
              </li>
            ))}
          </ol>
        </details>

        <p className="mt-4 border-t border-noche-800 pt-3 text-xs font-semibold tracking-wide text-dorado-300">
          {destino.detalle}
        </p>
      </div>
    </li>
  );
}
