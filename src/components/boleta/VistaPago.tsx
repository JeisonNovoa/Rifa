import { BotonCopiar } from "@/components/boleta/BotonCopiar";
import { CuentaRegresiva } from "@/components/boleta/CuentaRegresiva";
import { DatosPago } from "@/components/boleta/DatosPago";
import { FormularioComprobante } from "@/components/boleta/FormularioComprobante";
import { IconoWhatsApp } from "@/components/decoracion/Iconos";
import { ABONO_MINIMO_PREDETERMINADO } from "@/lib/constants";
import { WHATSAPP_CONTACTO } from "@/lib/contenido";
import type { BoletaComprador } from "@/lib/datos/boleta";
import { dosDigitos, formatearFechaHora, formatearPesos } from "@/lib/formato";
import type { RifaPublica } from "@/lib/types";

interface VistaPagoProps {
  boleta: BoletaComprador;
  rifa: RifaPublica;
  token: string;
}

/** Estado "reservado": primer pago (completo o abono) + subida del comprobante. */
export function VistaPago({ boleta, rifa, token }: VistaPagoProps) {
  const abonoMinimo = rifa.abono_minimo ?? ABONO_MINIMO_PREDETERMINADO;

  return (
    <section className="pt-10">
      <p className="font-titulo text-sm tracking-[0.35em] text-dorado-400">
        ¡BUENA ELECCIÓN!
      </p>
      <h1 className="mt-2 font-titulo text-4xl text-crema-50 sm:text-5xl">
        Apartaste el{" "}
        <span className="trazo-dorado">{dosDigitos(boleta.numero)}</span>
      </h1>
      {boleta.comprador_nombre && (
        <p className="mt-3 text-noche-300">
          A nombre de{" "}
          <strong className="font-semibold text-crema-50">
            {boleta.comprador_nombre}
          </strong>
          .
        </p>
      )}

      {boleta.reservado_hasta && (
        <CuentaRegresiva hasta={boleta.reservado_hasta} className="mt-5" />
      )}

      {/* Las dos formas de pagar */}
      <div className="mt-6 rounded-xl border border-dorado-500/30 bg-noche-900/50 p-4 text-sm leading-relaxed text-noche-300">
        Puedes pagar la boleta{" "}
        <strong className="font-semibold text-crema-50">
          completa ({formatearPesos(rifa.precio_por_numero)})
        </strong>{" "}
        o apartarla desde{" "}
        <strong className="font-semibold text-dorado-300">
          {formatearPesos(abonoMinimo)}
        </strong>{" "}
        e ir abonando a tu ritmo.
        {rifa.limite_pago && (
          <>
            {" "}
            Plazo máximo:{" "}
            <strong className="font-semibold text-crema-50">
              {formatearFechaHora(rifa.limite_pago)}
            </strong>
            . Boleta que no esté 100% paga no juega.
          </>
        )}
      </div>

      <DatosPago rifa={rifa} className="mt-6" />

      <FormularioComprobante
        ticketId={boleta.ticket_id}
        token={token}
        precio={rifa.precio_por_numero}
        abonoMinimo={abonoMinimo}
        restante={rifa.precio_por_numero - boleta.total_abonado}
        esPrimerPago={boleta.total_abonado === 0}
        className="mt-8"
      />

      <GuardaEnlace className="mt-8" />
    </section>
  );
}

/** Recordatorio para no perder la boleta (no hay cuentas de usuario). */
export function GuardaEnlace({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-noche-800 bg-noche-900/60 p-4 ${className}`}
    >
      <p className="text-sm font-semibold text-crema-50">
        Guarda este enlace: es tu boleta digital
      </p>
      <p className="mt-1 text-sm leading-relaxed text-noche-300">
        Con él vuelves aquí cuando quieras para abonar, subir comprobantes o
        ver el estado de tu número.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <BotonCopiar etiqueta="Copiar mi enlace" apariencia="oscura" />
        <a
          href={`https://wa.me/57${WHATSAPP_CONTACTO}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-noche-300 underline decoration-noche-600 underline-offset-4 transition-colors hover:text-crema-50"
        >
          <IconoWhatsApp className="h-4 w-4" />
          ¿Dudas? Escríbenos
        </a>
      </div>
    </div>
  );
}
