import {
  IconoBoleto,
  IconoFlechaAbajo,
} from "@/components/decoracion/Iconos";
import { RutaAvion } from "@/components/decoracion/RutaAvion";
import { SelloRifa } from "@/components/decoracion/SelloRifa";
import { formatearFechaCorta, formatearPesos } from "@/lib/formato";
import type { RifaPublica } from "@/lib/types";

interface HeroRifaProps {
  rifa: RifaPublica;
}

export function HeroRifa({ rifa }: HeroRifaProps) {
  return (
    <header className="relative">
      {/* Cinta superior: sello + fecha del sorteo */}
      <div className="animar-entrada relative flex items-center justify-between pt-6">
        <SelloRifa className="w-16 -rotate-6 text-dorado-400 sm:w-20" />
        <p className="text-right text-sm leading-snug text-noche-300">
          Sorteo
          <br />
          <span className="font-semibold text-crema-50">
            {formatearFechaCorta(rifa.fecha_sorteo)}
          </span>
        </p>
      </div>

      {/* Título de cartel */}
      <div className="relative pb-4 pt-12 sm:pt-16">
        <p className="animar-entrada font-titulo text-sm tracking-[0.35em] text-dorado-400">
          GRAN RIFA · TÚ ELIGES TU DESTINO
        </p>
        <h1 className="mt-3">
          <span className="animar-entrada retraso-1 block font-titulo text-[clamp(3.4rem,13vw,6.5rem)] leading-[0.92] text-crema-50">
            VIAJA POR
          </span>
          <span className="animar-entrada retraso-2 -mt-[0.24em] block -rotate-2 pl-[0.15em] font-script text-[clamp(3rem,11.5vw,5.6rem)] leading-none text-dorado-400">
            Colombia
          </span>
        </h1>

        <p className="animar-entrada retraso-3 mt-6 max-w-md text-lg leading-relaxed text-noche-300">
          Gánate{" "}
          <strong className="font-semibold text-crema-50">
            un viaje todo incluido para dos personas
          </strong>{" "}
          al destino que elijas, más{" "}
          <strong className="font-semibold text-crema-50">
            $500.000 de viáticos
          </strong>{" "}
          para vivir tu aventura al máximo.
        </p>

        <div className="animar-entrada retraso-4 mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
          {rifa.estado === "activa" ? (
            <>
              <a href="#numeros" className="btn-dorado">
                <IconoBoleto className="h-5 w-5" />
                Escoge tu número · {formatearPesos(rifa.precio_por_numero)}
              </a>
              <a
                href="#como-funciona"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-noche-300 underline decoration-noche-600 underline-offset-4 transition-colors hover:text-crema-50"
              >
                ¿Cómo funciona?
                <IconoFlechaAbajo className="h-3.5 w-3.5" />
              </a>
            </>
          ) : (
            <a href="#numeros" className="btn-dorado">
              <IconoBoleto className="h-5 w-5" />
              Ver el resultado del sorteo
            </a>
          )}
        </div>

        {rifa.estado === "activa" && (
          <p className="animar-entrada retraso-4 mt-4 text-sm text-noche-300">
            💛 Apártala desde{" "}
            <strong className="font-semibold text-dorado-300">
              {formatearPesos(rifa.abono_minimo ?? 20000)}
            </strong>{" "}
            y termina de pagar antes del sorteo.
          </p>
        )}

        <RutaAvion className="mt-8 w-56 text-dorado-400/40 sm:w-72" />
      </div>
    </header>
  );
}
