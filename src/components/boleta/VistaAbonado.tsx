import { BarraProgreso } from "@/components/boleta/BarraProgreso";
import { DatosPago } from "@/components/boleta/DatosPago";
import { FormularioComprobante } from "@/components/boleta/FormularioComprobante";
import { GuardaEnlace } from "@/components/boleta/VistaPago";
import type { BoletaComprador } from "@/lib/datos/boleta";
import {
  dosDigitos,
  formatearFechaHora,
  formatearPesos,
} from "@/lib/formato";
import type { RifaPublica } from "@/lib/types";

interface VistaAbonadoProps {
  boleta: BoletaComprador;
  rifa: RifaPublica;
  token: string;
}

/**
 * Estado "abonado": el número está apartado a su nombre (sin límite de
 * tiempo de reserva), pero falta plata. Desde aquí sigue abonando.
 */
export function VistaAbonado({ boleta, rifa, token }: VistaAbonadoProps) {
  const restante = rifa.precio_por_numero - boleta.total_abonado;

  return (
    <section className="pt-10">
      <p className="font-titulo text-sm tracking-[0.35em] text-dorado-400">
        ¡NÚMERO APARTADO!
      </p>
      <h1 className="mt-2 font-titulo text-4xl text-crema-50 sm:text-5xl">
        El <span className="trazo-dorado">{dosDigitos(boleta.numero)}</span> es
        casi tuyo
      </h1>
      {boleta.comprador_nombre && (
        <p className="mt-3 text-noche-300">
          Apartado a nombre de{" "}
          <strong className="font-semibold text-crema-50">
            {boleta.comprador_nombre}
          </strong>
          .
        </p>
      )}

      <BarraProgreso
        abonado={boleta.total_abonado}
        precio={rifa.precio_por_numero}
        className="mt-6"
      />

      {rifa.limite_pago && (
        <p className="mt-4 rounded-xl border border-dorado-500/30 bg-noche-900/50 p-4 text-sm leading-relaxed text-noche-300">
          ⏳ Completa tu pago antes del{" "}
          <strong className="font-semibold text-crema-50">
            {formatearFechaHora(rifa.limite_pago)}
          </strong>
          . <strong className="font-semibold text-dorado-300">
            Boleta que no esté 100% paga no juega.
          </strong>
        </p>
      )}

      {boleta.abono_pendiente ? (
        <div className="mt-8 rounded-2xl border border-dorado-500/40 bg-dorado-400/5 p-5">
          <p className="font-titulo text-xs tracking-[0.28em] text-dorado-400">
            ABONO EN REVISIÓN
          </p>
          <p className="mt-2 text-sm leading-relaxed text-noche-300">
            Recibimos tu abono de{" "}
            <strong className="font-titulo text-base text-dorado-300">
              {formatearPesos(boleta.abono_pendiente.monto)}
            </strong>
            . El organizador lo está verificando; apenas lo confirme, tu
            progreso se actualiza aquí.
          </p>
        </div>
      ) : (
        <>
          <DatosPago rifa={rifa} className="mt-8" />
          <FormularioComprobante
            ticketId={boleta.ticket_id}
            token={token}
            precio={rifa.precio_por_numero}
            abonoMinimo={rifa.abono_minimo ?? 1000}
            restante={restante}
            esPrimerPago={false}
            titulo="SUBE TU SIGUIENTE ABONO"
            className="mt-8"
          />
        </>
      )}

      {boleta.abonos_confirmados.length > 0 && (
        <div className="mt-8">
          <p className="text-xs font-semibold tracking-wide text-noche-400">
            TUS ABONOS CONFIRMADOS
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-noche-300">
            {boleta.abonos_confirmados.map((abono) => (
              <li key={abono.id} className="flex items-center justify-between rounded-lg border border-noche-800 bg-noche-900/40 px-3 py-2">
                <span>{fechaCorta(abono.resuelto_en ?? abono.creado_en)}</span>
                <strong className="font-titulo text-dorado-400">
                  {formatearPesos(abono.monto)}
                </strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      <GuardaEnlace numero={boleta.numero} className="mt-8" />
    </section>
  );
}

function fechaCorta(iso: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    timeZone: "America/Bogota",
  }).format(new Date(iso));
}
