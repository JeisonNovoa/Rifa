"use client";

import { useEffect } from "react";
import { SelloRifa } from "@/components/decoracion/SelloRifa";

/**
 * Página de error de la marca (reemplaza la pantalla genérica de Next).
 * Aparece si algo explota en el servidor; el botón reintenta SIN perder
 * la URL (clave en la boleta: el token va en la dirección).
 */
export default function PaginaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error de la aplicación:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <SelloRifa className="w-20 -rotate-6 text-dorado-400" />
      <p className="mt-6 font-titulo text-6xl text-dorado-400">¡Uy!</p>
      <h1 className="mt-3 font-titulo text-2xl text-crema-50">
        Algo falló de nuestro lado
      </h1>
      <p className="mt-3 leading-relaxed text-noche-300">
        No es tu culpa y{" "}
        <strong className="font-semibold text-crema-50">
          no perdiste nada
        </strong>
        : tu número y tus pagos están a salvo. Dale reintentar.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        <button type="button" onClick={reset} className="btn-dorado">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4h-4" />
          </svg>
          Reintentar
        </button>
        <a
          href="/"
          className="text-sm font-medium text-noche-300 underline decoration-noche-600 underline-offset-4 transition-colors hover:text-crema-50"
        >
          Ir al inicio
        </a>
      </div>
      {error.digest && (
        <p className="mt-8 text-[11px] text-noche-400/70">
          Código de referencia: {error.digest}
        </p>
      )}
    </main>
  );
}
