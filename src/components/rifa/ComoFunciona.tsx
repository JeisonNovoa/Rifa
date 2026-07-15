import { AVISOS_SEGURIDAD } from "@/lib/contenido";
import { ABONO_MINIMO_PREDETERMINADO } from "@/lib/constants";
import {
  formatearFechaHora,
  formatearFechaLarga,
  formatearPesos,
} from "@/lib/formato";
import type { RifaPublica } from "@/lib/types";

interface ComoFuncionaProps {
  rifa: RifaPublica;
}

export function ComoFunciona({ rifa }: ComoFuncionaProps) {
  const abonoMinimo = rifa.abono_minimo ?? ABONO_MINIMO_PREDETERMINADO;
  const pasos = [
    {
      titulo: "Escoge tu número",
      descripcion: `Tócalo en el tablero y queda apartado ${rifa.minutos_reserva} minutos para hacer tu primer pago.`,
    },
    {
      titulo: "Paga por Nequi",
      descripcion: `Boleta completa (${formatearPesos(rifa.precio_por_numero)}) o apártala con mínimo ${formatearPesos(abonoMinimo)}. Sube el comprobante.`,
    },
    {
      titulo: "Confirmamos tu pago",
      descripcion:
        "Verificamos la plata: si pagaste completo, el número queda VENDIDO; si abonaste, queda APARTADO a tu nombre sin límite de reserva.",
    },
    {
      titulo: "Completa tu boleta",
      descripcion: rifa.limite_pago
        ? `Sigue abonando desde tu boleta digital cuando quieras, antes del ${formatearFechaHora(rifa.limite_pago)}. Boleta que no esté 100% paga no juega.`
        : "Sigue abonando desde tu boleta digital hasta completar el valor. Boleta que no esté 100% paga no juega.",
    },
  ];

  return (
    <section
      id="como-funciona"
      aria-labelledby="titulo-como"
      className="revelar relative z-10 mt-20 scroll-mt-8 sm:mt-28"
    >
      <p className="font-titulo text-xs tracking-[0.3em] text-dorado-400">
        PASO A PASO
      </p>
      <h2
        id="titulo-como"
        className="mt-2 font-titulo text-3xl text-crema-50 sm:text-4xl"
      >
        Así de fácil
      </h2>

      {/* Pasos sobre una ruta punteada */}
      <ol className="mt-10 space-y-9 border-l border-dashed border-noche-600 pl-6 sm:pl-8">
        {pasos.map((paso, indice) => (
          <li key={paso.titulo} className="relative">
            <span className="absolute -left-[2.625rem] flex h-9 w-9 items-center justify-center rounded-full border border-dorado-500/60 bg-noche-950 font-titulo text-sm text-dorado-400 sm:-left-[3.125rem]">
              {indice + 1}
            </span>
            <h3 className="text-lg font-semibold text-crema-50">{paso.titulo}</h3>
            <p className="mt-1 max-w-md text-noche-300">{paso.descripcion}</p>
          </li>
        ))}
      </ol>

      {/* Boleta crema: cómo se elige el ganador */}
      <div className="mt-12 overflow-hidden rounded-2xl bg-crema-50 text-noche-900 shadow-xl shadow-noche-900/40">
        <div className="perforado" aria-hidden="true" />
        <div className="px-6 py-7 sm:px-8">
          <p className="font-titulo text-xs tracking-[0.28em] text-rojo-500">
            ¿CÓMO SE ELIGE EL GANADOR?
          </p>
          <p className="mt-3 font-titulo text-2xl leading-tight sm:text-3xl">
            Gana quien tenga las{" "}
            <span className="text-rojo-500">2 últimas cifras</span> del premio
            mayor
          </p>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-noche-900/70">
            Jugamos con la{" "}
            <strong className="font-semibold text-noche-900">
              Lotería de Boyacá
            </strong>{" "}
            el {formatearFechaLarga(rifa.fecha_sorteo).toLowerCase()}. Tu número
            del tablero son esas dos cifras: si coinciden con el premio mayor,
            ¡el viaje es tuyo!
          </p>
          <p className="mt-4 inline-block -rotate-2 font-script text-2xl text-rojo-500">
            ¡Solo un ganador!
          </p>
        </div>
        <div className="perforado" aria-hidden="true" />
      </div>

      {/* Compromisos de seguridad */}
      <ul className="mt-10 space-y-2.5">
        {AVISOS_SEGURIDAD.map((aviso) => (
          <li
            key={aviso}
            className="flex items-start gap-2.5 text-sm text-noche-300"
          >
            <CandadoIcono />
            {aviso}
          </li>
        ))}
      </ul>
    </section>
  );
}

function CandadoIcono() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="mt-0.5 h-4 w-4 shrink-0 text-dorado-500"
      aria-hidden="true"
    >
      <rect x="3" y="7" width="10" height="7" rx="1.5" fill="currentColor" />
      <path
        d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
      />
    </svg>
  );
}
