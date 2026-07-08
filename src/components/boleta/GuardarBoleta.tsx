"use client";

import { useEffect, useState } from "react";
import {
  IconoCompartir,
  IconoEnlace,
  IconoListo,
  IconoWhatsApp,
} from "@/components/decoracion/Iconos";
import { WHATSAPP_CONTACTO } from "@/lib/contenido";
import { guardarBoleta } from "@/lib/boletas-guardadas";
import { dosDigitos } from "@/lib/formato";

interface GuardarBoletaProps {
  numero: number;
  className?: string;
}

/**
 * Bloque DESTACADO para que la persona no pierda su boleta:
 *  1. La guarda sola en este dispositivo (localStorage) al montarse.
 *  2. Botón grande para compartírsela por WhatsApp (Web Share o wa.me).
 *  3. Copiar el enlace como respaldo.
 * El enlace es la URL actual (que ya incluye el token secreto).
 */
export function GuardarBoleta({ numero, className = "" }: GuardarBoletaProps) {
  const [copiado, setCopiado] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    const actual = window.location.href;
    setUrl(actual);
    // Guarda la boleta en este dispositivo para poder recuperarla.
    guardarBoleta({
      numero,
      url: window.location.pathname + window.location.search,
      guardadaEn: Date.now(),
    });
  }, [numero]);

  const mensaje = `🎟️ Esta es mi boleta de la rifa Viaja por Colombia, número ${dosDigitos(
    numero
  )}. Guardo este enlace para pagar y ver mi número: ${url}`;

  const compartir = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mi boleta N.º ${dosDigitos(numero)}`,
          text: mensaje,
        });
        return;
      } catch {
        // El usuario canceló o el navegador falló: caemos a WhatsApp web.
      }
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(mensaje)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Portapapeles bloqueado: queda el botón de compartir.
    }
  };

  return (
    <div
      className={`rounded-2xl border-2 border-dorado-500/50 bg-dorado-400/[0.07] p-5 ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dorado-400/20 text-dorado-300">
          <IconoEnlace className="h-5 w-5" />
        </span>
        <div>
          <p className="font-titulo text-lg text-crema-50">
            Guarda tu boleta para no perderla
          </p>
          <p className="mt-1 text-sm leading-relaxed text-noche-300">
            Este enlace es tu boleta: con él vuelves a pagar y a ver tu número.
            Ya la guardamos en este celular, pero{" "}
            <strong className="font-semibold text-crema-50">
              mándatela por WhatsApp
            </strong>{" "}
            para tenerla siempre a la mano.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
        <button
          type="button"
          onClick={compartir}
          className="btn-dorado flex-1 justify-center"
        >
          <IconoWhatsApp className="h-5 w-5" />
          Enviármela por WhatsApp
        </button>
        <button
          type="button"
          onClick={copiar}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-noche-600 px-4 py-2.5 text-sm font-semibold text-crema-50 transition-colors hover:border-dorado-400 hover:text-dorado-300"
        >
          {copiado ? (
            <IconoListo className="h-4 w-4" />
          ) : (
            <IconoCompartir className="h-4 w-4" />
          )}
          {copiado ? "¡Copiado!" : "Copiar enlace"}
        </button>
      </div>

      <a
        href={`https://wa.me/57${WHATSAPP_CONTACTO}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-xs text-noche-400 underline decoration-noche-700 underline-offset-4 transition-colors hover:text-noche-300"
      >
        ¿Se te perdió el enlace? Escríbenos y te lo reenviamos
      </a>
    </div>
  );
}
