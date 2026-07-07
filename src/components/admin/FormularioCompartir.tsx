"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { BotonCopiar } from "@/components/boleta/BotonCopiar";
import { IconoDescargar } from "@/components/decoracion/Iconos";

/**
 * Genera el código QR que la gente escanea para llegar a la rifa.
 * Se descarga como PNG para pegarlo en el flyer o compartirlo directo.
 */
export function FormularioCompartir() {
  const lienzoRef = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  // La dirección por defecto es la del sitio donde está corriendo el panel.
  useEffect(() => {
    setUrl(process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin);
  }, []);

  useEffect(() => {
    if (!url || !lienzoRef.current) return;
    setError(null);
    QRCode.toCanvas(lienzoRef.current, url, {
      width: 640,
      margin: 2,
      color: { dark: "#101f3c", light: "#faf6ec" },
      errorCorrectionLevel: "H",
    })
      .then(() => {
        // La librería fija el tamaño físico (640px) como estilo en línea;
        // lo quitamos para que manden las clases (previsualización de 176px).
        const lienzo = lienzoRef.current;
        if (lienzo) {
          lienzo.style.width = "";
          lienzo.style.height = "";
        }
      })
      .catch((causa: unknown) => {
        console.error("No se pudo generar el QR:", causa);
        setError("No se pudo generar el QR. Revisa la dirección.");
      });
  }, [url]);

  const descargar = () => {
    const lienzo = lienzoRef.current;
    if (!lienzo) return;
    const enlace = document.createElement("a");
    enlace.download = "qr-rifa-viaja-por-colombia.png";
    enlace.href = lienzo.toDataURL("image/png");
    enlace.click();
  };

  return (
    <section className="rounded-2xl border border-noche-800 bg-noche-900/50 p-5">
      <h2 className="font-titulo text-lg text-crema-50">Compartir la rifa</h2>
      <p className="mt-1 max-w-2xl text-sm text-noche-300">
        Este es el QR que la gente escanea para llegar al tablero. Descárgalo
        en PNG y pégalo en el flyer, o compártelo directo por WhatsApp junto
        con el enlace.
      </p>

      <div className="mt-4 flex flex-wrap items-start gap-6">
        <div className="rounded-xl bg-crema-50 p-2.5 shadow-lg shadow-noche-950/40">
          <canvas
            ref={lienzoRef}
            className="block h-44 w-44 rounded-lg"
            aria-label={`Código QR que lleva a ${url}`}
          />
        </div>

        <div className="min-w-56 flex-1 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-noche-300">
              Dirección a la que apunta
            </span>
            <input
              type="url"
              value={url}
              onChange={(evento) => setUrl(evento.target.value)}
              className="w-full rounded-lg border border-noche-600 bg-noche-900/60 px-3 py-2.5 text-sm text-crema-50 focus:border-dorado-400 focus:outline-none"
            />
          </label>

          {error && (
            <p role="alert" className="text-sm font-medium text-rojo-400">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={descargar}
              className="btn-dorado !px-5 !py-2.5 text-sm"
            >
              <IconoDescargar className="h-4 w-4" />
              Descargar QR en PNG
            </button>
            <BotonCopiar valor={url} etiqueta="Copiar enlace" apariencia="oscura" />
          </div>

          <p className="text-xs text-noche-400">
            Consejo: imprime una prueba y escanéala con tu celular antes de
            mandar el flyer a todo el mundo.
          </p>
        </div>
      </div>
    </section>
  );
}
