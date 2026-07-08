import Link from "next/link";
import { IconoBoleto } from "@/components/decoracion/Iconos";
import { FormularioComprobante } from "@/components/boleta/FormularioComprobante";
import { GuardaEnlace } from "@/components/boleta/VistaPago";
import type { BoletaComprador } from "@/lib/datos/boleta";
import {
  dosDigitos,
  formatearFechaLarga,
  formatearPesos,
} from "@/lib/formato";
import type { RifaPublica } from "@/lib/types";

/* Vistas de la boleta para los estados distintos a "reservado".
   Son pequeñas y comparten estética, por eso viven juntas. */

interface VistaConBoletaProps {
  boleta: BoletaComprador;
  rifa: RifaPublica;
  token: string;
}

/** Estado "en_revision": primer comprobante recibido, esperando al organizador. */
export function VistaEnRevision({ boleta, rifa, token }: VistaConBoletaProps) {
  return (
    <section className="pt-10">
      <p className="font-titulo text-sm tracking-[0.35em] text-dorado-400">
        ¡COMPROBANTE RECIBIDO!
      </p>
      <h1 className="mt-2 font-titulo text-4xl text-crema-50 sm:text-5xl">
        El <span className="trazo-dorado">{dosDigitos(boleta.numero)}</span>{" "}
        está en revisión
      </h1>
      <p className="mt-3 max-w-md leading-relaxed text-noche-300">
        Estamos verificando tu pago
        {boleta.abono_pendiente && (
          <>
            {" "}
            de{" "}
            <strong className="font-titulo text-base text-dorado-300">
              {formatearPesos(boleta.abono_pendiente.monto)}
            </strong>
          </>
        )}
        . Cuando el organizador lo confirme, el número queda apartado a tu
        nombre (o vendido si pagaste completo) y te avisamos por WhatsApp.
      </p>

      {boleta.url_comprobante && (
        <figure className="mt-6">
          <figcaption className="text-xs font-semibold tracking-wide text-noche-400">
            TU COMPROBANTE
          </figcaption>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={boleta.url_comprobante}
            alt={`Comprobante de pago del número ${dosDigitos(boleta.numero)}`}
            className="mt-2 max-h-72 w-auto rounded-xl border border-noche-800"
          />
        </figure>
      )}

      <FormularioComprobante
        ticketId={boleta.ticket_id}
        token={token}
        precio={rifa.precio_por_numero}
        abonoMinimo={rifa.abono_minimo ?? 20000}
        restante={rifa.precio_por_numero - boleta.total_abonado}
        esPrimerPago={boleta.total_abonado === 0}
        titulo="¿TE EQUIVOCASTE? SUBE LA FOTO O EL MONTO DE NUEVO"
        className="mt-8"
      />

      <GuardaEnlace numero={boleta.numero} className="mt-8" />
      <p className="mt-6 text-xs text-noche-400">
        Rifa {rifa.nombre} · sorteo {formatearFechaLarga(rifa.fecha_sorteo).toLowerCase()}.
      </p>
    </section>
  );
}

/** Estado "vendido": ¡el número ya es del comprador! */
export function VistaVendida({ boleta, rifa }: Omit<VistaConBoletaProps, "token">) {
  return (
    <section className="pt-10">
      <div className="overflow-hidden rounded-2xl bg-crema-50 text-noche-900 shadow-xl shadow-noche-900/40">
        <div className="perforado" aria-hidden="true" />
        <div className="px-6 py-8 text-center sm:px-8">
          <p className="font-titulo text-xs tracking-[0.28em] text-rojo-500">
            PAGO CONFIRMADO
          </p>
          <p className="mt-4 font-titulo text-[10px] tracking-[0.2em] text-rojo-500">
            N.º
          </p>
          <p className="font-titulo text-7xl leading-none text-rojo-500">
            {dosDigitos(boleta.numero)}
          </p>
          <h1 className="mt-4 font-titulo text-2xl sm:text-3xl">
            ¡Es tuyo{boleta.comprador_nombre ? `, ${boleta.comprador_nombre}` : ""}!
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-noche-900/70">
            Juega el {formatearFechaLarga(rifa.fecha_sorteo).toLowerCase()} con
            las 2 últimas cifras del premio mayor de la Lotería de Boyacá.
          </p>
          <p className="mt-4 inline-block -rotate-2 font-script text-3xl text-rojo-500">
            ¡Mucha suerte!
          </p>
        </div>
        <div className="perforado" aria-hidden="true" />
      </div>

      <GuardaEnlace numero={boleta.numero} className="mt-8" />
    </section>
  );
}

/** La reserva venció y el número volvió a quedar libre. */
export function VistaExpirada({ numero }: { numero: number }) {
  return (
    <section className="pt-10">
      <p className="font-titulo text-sm tracking-[0.35em] text-rojo-400">
        SE ACABÓ EL TIEMPO
      </p>
      <h1 className="mt-2 font-titulo text-4xl text-crema-50 sm:text-5xl">
        La reserva del {dosDigitos(numero)} venció
      </h1>
      <p className="mt-3 max-w-md leading-relaxed text-noche-300">
        El número volvió a quedar libre para todos. Si aún lo quieres, corre a
        apartarlo de nuevo antes de que otra persona lo tome.
      </p>
      <Link href="/#numeros" className="btn-dorado mt-6">
        <IconoBoleto className="h-5 w-5" />
        Volver al tablero
      </Link>
    </section>
  );
}

/** Enlace inválido: token incorrecto o reserva liberada hace rato. */
export function VistaInvalida() {
  return (
    <section className="pt-10">
      <p className="font-titulo text-sm tracking-[0.35em] text-rojo-400">
        ENLACE NO VÁLIDO
      </p>
      <h1 className="mt-2 font-titulo text-4xl text-crema-50 sm:text-5xl">
        Esta boleta no existe o venció
      </h1>
      <p className="mt-3 max-w-md leading-relaxed text-noche-300">
        Puede que el enlace esté incompleto o que la reserva haya vencido y el
        número se liberó. Tranquilo: puedes escoger tu número otra vez.
      </p>
      <Link href="/#numeros" className="btn-dorado mt-6">
        <IconoBoleto className="h-5 w-5" />
        Ir al tablero
      </Link>
    </section>
  );
}
