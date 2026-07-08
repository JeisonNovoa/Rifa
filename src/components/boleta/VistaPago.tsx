import { CuentaRegresiva } from "@/components/boleta/CuentaRegresiva";
import { DatosPago } from "@/components/boleta/DatosPago";
import { FormularioComprobante } from "@/components/boleta/FormularioComprobante";
import { GuardarBoleta } from "@/components/boleta/GuardarBoleta";
import { ABONO_MINIMO_PREDETERMINADO } from "@/lib/constants";
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

      <GuardaEnlace numero={boleta.numero} className="mt-8" />
    </section>
  );
}

/**
 * Recordatorio para no perder la boleta. Reexporta el bloque destacado
 * GuardarBoleta (guarda en el dispositivo + compartir por WhatsApp).
 */
export function GuardaEnlace({
  numero,
  className = "",
}: {
  numero: number;
  className?: string;
}) {
  return <GuardarBoleta numero={numero} className={className} />;
}
