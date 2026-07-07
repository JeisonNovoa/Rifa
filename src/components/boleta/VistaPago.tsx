import { BotonCopiar } from "@/components/boleta/BotonCopiar";
import { CuentaRegresiva } from "@/components/boleta/CuentaRegresiva";
import { DatosPago } from "@/components/boleta/DatosPago";
import { FormularioComprobante } from "@/components/boleta/FormularioComprobante";
import type { BoletaComprador } from "@/lib/datos/boleta";
import { dosDigitos } from "@/lib/formato";
import type { RifaPublica } from "@/lib/types";

interface VistaPagoProps {
  boleta: BoletaComprador;
  rifa: RifaPublica;
  token: string;
}

/** Estado "reservado": instrucciones de pago + subida del comprobante. */
export function VistaPago({ boleta, rifa, token }: VistaPagoProps) {
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

      <DatosPago rifa={rifa} className="mt-8" />

      <FormularioComprobante
        ticketId={boleta.ticket_id}
        token={token}
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
        Con él vuelves aquí cuando quieras para subir el comprobante o ver el
        estado de tu número.
      </p>
      <BotonCopiar
        etiqueta="Copiar mi enlace"
        apariencia="oscura"
        className="mt-3"
      />
    </div>
  );
}
