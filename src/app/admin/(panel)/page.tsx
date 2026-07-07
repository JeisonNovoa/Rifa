import { FilaReserva } from "@/components/admin/FilaReserva";
import { TarjetaPendiente } from "@/components/admin/TarjetaPendiente";
import { BotonAccion } from "@/components/admin/BotonAccion";
import { DESCRIPCION_EVENTO } from "@/components/admin/etiquetas";
import { accionLiberarVencidas } from "@/lib/acciones/admin";
import {
  firmarComprobantes,
  obtenerEventosRecientes,
  obtenerTicketsAdmin,
  reservaVigente,
  resumirTickets,
} from "@/lib/datos/admin";
import { obtenerRifaPublica } from "@/lib/datos/rifa";
import { dosDigitos, formatearPesos } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function PaginaResumen() {
  const [rifa, tickets, eventos] = await Promise.all([
    obtenerRifaPublica(),
    obtenerTicketsAdmin(),
    obtenerEventosRecientes(),
  ]);

  const resumen = resumirTickets(tickets, rifa.precio_por_numero);
  const pendientes = await firmarComprobantes(
    tickets.filter((t) => t.estado === "en_revision")
  );
  const reservasActivas = tickets
    .filter((t) => reservaVigente(t))
    .sort(
      (a, b) =>
        new Date(a.reservado_hasta ?? 0).getTime() -
        new Date(b.reservado_hasta ?? 0).getTime()
    );

  return (
    <div className="space-y-10">
      {/* Estado general */}
      <section aria-labelledby="titulo-resumen">
        <h1 id="titulo-resumen" className="font-titulo text-3xl text-crema-50">
          Resumen
        </h1>
        <p className="mt-2 text-sm text-noche-300">
          {rifa.estado === "activa" ? (
            <span className="font-medium text-dorado-300">● Ventas abiertas</span>
          ) : (
            <span className="font-medium text-rojo-400">● Ventas cerradas</span>
          )}
          {rifa.numero_ganador !== null && (
            <>
              {" "}
              · 🏆 Ganador:{" "}
              <strong className="font-titulo text-dorado-400">
                {dosDigitos(rifa.numero_ganador)}
              </strong>
            </>
          )}
        </p>
        <p className="mt-2 text-sm text-noche-300">
          {resumen.libres} libres · {resumen.reservados} reservados ·{" "}
          {resumen.en_revision} por revisar · {resumen.vendidos} vendidos
        </p>
        <p className="mt-3 font-titulo text-2xl text-dorado-400">
          {formatearPesos(resumen.recaudo)}{" "}
          <span className="text-base text-noche-300">
            recaudados de {formatearPesos(resumen.recaudo_posible)} posibles
          </span>
        </p>
      </section>

      {/* Pagos por revisar */}
      <section aria-labelledby="titulo-pendientes">
        <h2 id="titulo-pendientes" className="font-titulo text-xl text-crema-50">
          Por revisar ({pendientes.length})
        </h2>
        {pendientes.length === 0 ? (
          <p className="mt-3 rounded-xl border border-noche-800 bg-noche-900/40 p-4 text-sm text-noche-300">
            Nada pendiente. Cuando alguien suba un comprobante, aparece aquí
            para que confirmes o rechaces el pago.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {pendientes.map((pendiente) => (
              <TarjetaPendiente
                key={pendiente.id}
                ticketId={pendiente.id}
                numero={pendiente.numero}
                nombre={pendiente.comprador_nombre}
                whatsapp={pendiente.comprador_whatsapp}
                urlComprobante={pendiente.url_comprobante_firmada}
                actualizadoHace={haceCuanto(pendiente.actualizado_en)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Reservas activas */}
      <section aria-labelledby="titulo-reservas">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="titulo-reservas" className="font-titulo text-xl text-crema-50">
            Reservas activas ({reservasActivas.length})
          </h2>
          <BotonAccion
            accion={accionLiberarVencidas}
            etiqueta="Limpiar reservas vencidas"
            etiquetaPendiente="Limpiando…"
            variante="sutil"
          />
        </div>
        {reservasActivas.length === 0 ? (
          <p className="mt-3 rounded-xl border border-noche-800 bg-noche-900/40 p-4 text-sm text-noche-300">
            Nadie está reservando en este momento.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {reservasActivas.map((reserva) => (
              <FilaReserva
                key={reserva.id}
                ticketId={reserva.id}
                numero={reserva.numero}
                nombre={reserva.comprador_nombre}
                whatsapp={reserva.comprador_whatsapp}
                reservadoHasta={reserva.reservado_hasta ?? ""}
              />
            ))}
          </div>
        )}
      </section>

      {/* Historial */}
      <section aria-labelledby="titulo-eventos">
        <h2 id="titulo-eventos" className="font-titulo text-xl text-crema-50">
          Últimos movimientos
        </h2>
        {eventos.length === 0 ? (
          <p className="mt-3 text-sm text-noche-300">Sin movimientos aún.</p>
        ) : (
          <ul className="mt-3 space-y-1.5 text-sm">
            {eventos.map((evento) => (
              <li key={evento.id} className="flex flex-wrap gap-x-2 text-noche-300">
                <span className="tabular-nums text-noche-400">
                  {horaCorta(evento.creado_en)}
                </span>
                <span>
                  {DESCRIPCION_EVENTO[evento.accion] ?? evento.accion}
                  {evento.numero !== null && (
                    <>
                      {" "}
                      · N.º{" "}
                      <strong className="font-titulo text-dorado-400">
                        {dosDigitos(evento.numero)}
                      </strong>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function haceCuanto(fechaIso: string): string {
  const minutos = Math.floor((Date.now() - new Date(fechaIso).getTime()) / 60_000);
  if (minutos < 1) return "hace nada";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  return `hace ${Math.floor(horas / 24)} día(s)`;
}

function horaCorta(fechaIso: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Bogota",
  }).format(new Date(fechaIso));
}
