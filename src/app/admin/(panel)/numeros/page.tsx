import { headers } from "next/headers";
import { BotonAccion } from "@/components/admin/BotonAccion";
import { FormularioVentaManual } from "@/components/admin/FormularioVentaManual";
import { ESTILO_INSIGNIA, ETIQUETA_ESTADO } from "@/components/admin/etiquetas";
import { BotonCopiar } from "@/components/boleta/BotonCopiar";
import { IconoWhatsApp } from "@/components/decoracion/Iconos";
import {
  accionConfirmarPago,
  accionRechazarPago,
  accionRevertirVenta,
} from "@/lib/acciones/admin";
import {
  obtenerTicketsAdmin,
  reservaVigente,
  type TicketAdmin,
} from "@/lib/datos/admin";
import { obtenerRifaPublica } from "@/lib/datos/rifa";
import { dosDigitos } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function PaginaNumeros() {
  const [rifa, tickets, base] = await Promise.all([
    obtenerRifaPublica(),
    obtenerTicketsAdmin(),
    urlBase(),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="font-titulo text-3xl text-crema-50">Números</h1>

      <FormularioVentaManual raffleId={rifa.id} />

      <section aria-label="Listado de los 100 números">
        <div className="overflow-x-auto rounded-2xl border border-noche-800">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-noche-900/70 text-xs uppercase tracking-wide text-noche-300">
              <tr>
                <th className="px-4 py-3">N.º</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Comprador</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-noche-800/70">
              {tickets.map((ticket) => (
                <FilaNumero key={ticket.id} ticket={ticket} base={base} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function FilaNumero({ ticket, base }: { ticket: TicketAdmin; base: string }) {
  const vigente = reservaVigente(ticket);
  const estadoMostrado =
    ticket.estado === "reservado" && !vigente ? "disponible" : ticket.estado;
  const enlaceBoleta =
    ticket.token_gestion !== null
      ? `${base}/boleta/${ticket.id}?t=${ticket.token_gestion}`
      : null;

  return (
    <tr className="bg-noche-900/30">
      <td className="px-4 py-2.5 font-titulo text-lg text-dorado-400">
        {dosDigitos(ticket.numero)}
      </td>
      <td className="px-4 py-2.5">
        <span
          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${ESTILO_INSIGNIA[estadoMostrado]}`}
        >
          {ETIQUETA_ESTADO[estadoMostrado]}
          {ticket.estado === "reservado" && !vigente && " (venció)"}
        </span>
      </td>
      <td className="max-w-40 truncate px-4 py-2.5 text-crema-50">
        {ticket.comprador_nombre ?? "—"}
      </td>
      <td className="px-4 py-2.5">
        {ticket.comprador_whatsapp ? (
          <a
            href={`https://wa.me/57${ticket.comprador_whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-noche-300 underline decoration-noche-600 underline-offset-2 hover:text-crema-50"
          >
            <IconoWhatsApp className="h-3.5 w-3.5" />
            {ticket.comprador_whatsapp}
          </a>
        ) : (
          <span className="text-noche-400">—</span>
        )}
      </td>
      <td className="px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {ticket.estado === "en_revision" && (
            <>
              <BotonAccion
                accion={accionConfirmarPago}
                campos={{ ticketId: ticket.id }}
                etiqueta="Confirmar"
                variante="dorado"
                confirmacion={`¿Confirmar el pago del ${dosDigitos(ticket.numero)}?`}
              />
              <BotonAccion
                accion={accionRechazarPago}
                campos={{ ticketId: ticket.id, motivo: "rechazado desde la tabla" }}
                etiqueta="Rechazar"
                variante="peligro"
                confirmacion={`¿Rechazar y liberar el ${dosDigitos(ticket.numero)}?`}
              />
            </>
          )}
          {ticket.estado === "reservado" && vigente && (
            <BotonAccion
              accion={accionRechazarPago}
              campos={{
                ticketId: ticket.id,
                motivo: "liberada manualmente por el admin",
              }}
              etiqueta="Liberar"
              variante="peligro"
              confirmacion={`¿Liberar el ${dosDigitos(ticket.numero)}? La persona pierde su reserva.`}
            />
          )}
          {ticket.estado === "vendido" && (
            <>
              <BotonAccion
                accion={accionRevertirVenta}
                campos={{
                  ticketId: ticket.id,
                  motivo: "revertida desde la tabla",
                }}
                etiqueta="Revertir"
                variante="peligro"
                confirmacion={`¿Revertir la venta del ${dosDigitos(ticket.numero)}? Vuelve a "en revisión" (no se pierde nada) y ahí decides de nuevo.`}
              />
              {enlaceBoleta && (
                <BotonCopiar
                  valor={enlaceBoleta}
                  etiqueta="Copiar boleta"
                  apariencia="oscura"
                />
              )}
            </>
          )}
          {estadoMostrado === "disponible" && (
            <span className="text-xs text-noche-400">
              véndelo arriba si te pagaron directo
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

async function urlBase(): Promise<string> {
  const encabezados = await headers();
  const host = encabezados.get("host") ?? "localhost:3000";
  const protocolo =
    encabezados.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  return `${protocolo}://${host}`;
}
