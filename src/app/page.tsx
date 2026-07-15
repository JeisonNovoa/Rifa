import { AvionVolador } from "@/components/decoracion/AvionVolador";
import { IconoWhatsApp } from "@/components/decoracion/Iconos";
import { RutaAvion } from "@/components/decoracion/RutaAvion";
import { AnuncioGanador } from "@/components/rifa/AnuncioGanador";
import { MisBoletas } from "@/components/rifa/MisBoletas";
import { FRASE_FOOTER, TEXTO_LEGAL, WHATSAPP_CONTACTO } from "@/lib/contenido";
import { ComoFunciona } from "@/components/rifa/ComoFunciona";
import { Destinos } from "@/components/rifa/Destinos";
import { HeroRifa } from "@/components/rifa/HeroRifa";
import { TableroNumeros } from "@/components/tablero/TableroNumeros";
import { obtenerInfoGanador } from "@/lib/datos/ganador";
import { obtenerRifaPublica, obtenerTablero } from "@/lib/datos/rifa";
import { formatearFechaCorta } from "@/lib/formato";

// El tablero debe estar fresco en cada visita.
export const dynamic = "force-dynamic";

export default async function PaginaRifa() {
  try {
    const [rifa, tablero] = await Promise.all([
      obtenerRifaPublica(),
      obtenerTablero(),
    ]);

    return (
      <div className="relative">
        {/* Resplandor a ancho completo de la página (detrás de todo) */}
        <div className="resplandor-alba" aria-hidden="true" />

        <main className="relative mx-auto max-w-3xl px-5 pb-44 sm:px-8">
          <HeroRifa rifa={rifa} />
          <Destinos />

          {/* relative z-10: por delante del avión cuando este vuela "al fondo" */}
          <section
            id="numeros"
            aria-labelledby="titulo-numeros"
            className="relative z-10 mt-20 scroll-mt-8 sm:mt-28"
          >
            {rifa.estado === "cerrada" ? (
              <>
                <p className="font-titulo text-xs tracking-[0.3em] text-dorado-400">
                  EL SORTEO
                </p>
                <h2
                  id="titulo-numeros"
                  className="mt-2 font-titulo text-3xl text-crema-50 sm:text-4xl"
                >
                  {rifa.numero_ganador === null ? (
                    <>
                      Atentos al <span className="trazo-dorado">resultado</span>
                    </>
                  ) : (
                    <>
                      ¡Tenemos <span className="trazo-dorado">ganador</span>!
                    </>
                  )}
                </h2>
                <AnuncioGanador
                  fechaSorteo={rifa.fecha_sorteo}
                  ganador={await obtenerInfoGanador(rifa.numero_ganador)}
                />
              </>
            ) : (
              <>
                <p className="font-titulo text-xs tracking-[0.3em] text-dorado-400">
                  EL TABLERO
                </p>
                <h2
                  id="titulo-numeros"
                  className="mt-2 font-titulo text-3xl text-crema-50 sm:text-4xl"
                >
                  Escoge tu <span className="trazo-dorado">número</span> de la
                  suerte
                </h2>
                <MisBoletas />
                <div className="mt-6">
                  <TableroNumeros
                    inicial={tablero}
                    raffleId={rifa.id}
                    precio={rifa.precio_por_numero}
                    minutosReserva={rifa.minutos_reserva}
                  />
                </div>
              </>
            )}
          </section>

          <ComoFunciona rifa={rifa} />

          <footer className="revelar relative z-10 mt-24 border-t border-noche-800 pb-4 pt-8 text-center">
            <RutaAvion pista className="mx-auto w-44 text-dorado-400/30" />
            <p className="mt-2 font-script text-2xl text-dorado-400">
              {FRASE_FOOTER}
            </p>
            <a
              href={`https://wa.me/57${WHATSAPP_CONTACTO}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-noche-300 underline decoration-noche-600 underline-offset-4 transition-colors hover:text-crema-50"
            >
              <IconoWhatsApp className="h-4 w-4" />
              ¿Preguntas? Escríbenos: 300 758 3856
            </a>
            <p className="mt-4 text-xs text-noche-400">
              Viaja por Colombia · Rifa 00–99 · Sorteo{" "}
              {formatearFechaCorta(rifa.fecha_sorteo)} con la Lotería de Boyacá
            </p>
            <p className="mt-1.5 text-[11px] text-noche-400/80">{TEXTO_LEGAL}</p>
          </footer>
        </main>

        {/* Avioncito que vuela con el scroll (ver ANIMACION-AVION.md) */}
        <AvionVolador />
      </div>
    );
  } catch (error: unknown) {
    console.error("Error cargando la página de la rifa:", error);
    return <ErrorCarga />;
  }
}

function ErrorCarga() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="font-titulo text-6xl text-dorado-400">¡Uy!</p>
      <h1 className="mt-4 font-titulo text-2xl text-crema-50">
        No pudimos cargar la rifa
      </h1>
      <p className="mt-3 text-noche-300">
        Refresca la página en un momento. Si sigue fallando, avísale al
        organizador.
      </p>
    </main>
  );
}
