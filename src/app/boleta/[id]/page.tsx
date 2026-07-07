import type { Metadata } from "next";
import Link from "next/link";
import { SelloRifa } from "@/components/decoracion/SelloRifa";
import { VistaPago } from "@/components/boleta/VistaPago";
import {
  VistaEnRevision,
  VistaExpirada,
  VistaInvalida,
  VistaVendida,
} from "@/components/boleta/VistasEstado";
import { obtenerBoletaPorToken } from "@/lib/datos/boleta";
import { obtenerRifaPublica } from "@/lib/datos/rifa";
import { UUID_REGEX } from "@/lib/validacion";

// Estado en tiempo real + página privada del comprador: nada de caché ni buscadores.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Tu boleta — Viaja por Colombia",
  robots: { index: false, follow: false },
};

interface PaginaBoletaProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}

export default async function PaginaBoleta({
  params,
  searchParams,
}: PaginaBoletaProps) {
  const { id } = await params;
  const { t: token } = await searchParams;

  return (
    <div className="relative">
      <div className="resplandor-alba" aria-hidden="true" />
      <main className="relative mx-auto max-w-xl px-5 pb-24 sm:px-6">
        <div className="flex items-center justify-between pt-6">
          <SelloRifa className="w-14 -rotate-6 text-dorado-400" />
          <Link
            href="/#numeros"
            className="text-sm font-medium text-noche-300 underline decoration-noche-600 underline-offset-4 transition-colors hover:text-crema-50"
          >
            ← Volver al tablero
          </Link>
        </div>
        {await resolverContenido(id, token)}
      </main>
    </div>
  );
}

/** Decide qué vista mostrar según el token y el estado real en la base de datos. */
async function resolverContenido(id: string, token: string | undefined) {
  if (!token || !UUID_REGEX.test(id) || !UUID_REGEX.test(token)) {
    return <VistaInvalida />;
  }

  const boleta = await obtenerBoletaPorToken(id, token);
  if (!boleta) return <VistaInvalida />;

  const rifa = await obtenerRifaPublica();

  switch (boleta.estado) {
    case "reservado": {
      const vencida =
        !boleta.reservado_hasta ||
        new Date(boleta.reservado_hasta).getTime() <= Date.now();
      return vencida ? (
        <VistaExpirada numero={boleta.numero} />
      ) : (
        <VistaPago boleta={boleta} rifa={rifa} token={token} />
      );
    }
    case "en_revision":
      return <VistaEnRevision boleta={boleta} rifa={rifa} token={token} />;
    case "vendido":
      return <VistaVendida boleta={boleta} rifa={rifa} />;
    default:
      return <VistaExpirada numero={boleta.numero} />;
  }
}
