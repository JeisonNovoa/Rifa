import { DESTINOS } from "@/lib/contenido";

/** Lista editorial de los 4 destinos que puede elegir el ganador. */
export function Destinos() {
  return (
    <section aria-labelledby="titulo-destinos" className="mt-16 sm:mt-24">
      <p className="font-titulo text-xs tracking-[0.3em] text-dorado-400">
        EL PREMIO
      </p>
      <h2
        id="titulo-destinos"
        className="mt-2 font-titulo text-3xl text-crema-50 sm:text-4xl"
      >
        El ganador <span className="trazo-dorado">elige</span> el destino
      </h2>

      <ol className="mt-4 sm:grid sm:grid-cols-2 sm:gap-x-10">
        {DESTINOS.map((destino, indice) => (
          <li
            key={destino.nombre}
            className="flex items-baseline gap-4 border-b border-noche-800 py-5"
          >
            <span
              className="font-titulo text-2xl text-dorado-600/80"
              aria-hidden="true"
            >
              0{indice + 1}
            </span>
            <div>
              <h3 className="font-titulo text-xl tracking-wide text-crema-50">
                {destino.nombre}
              </h3>
              <p className="mt-1 text-sm text-noche-300">{destino.descripcion}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
