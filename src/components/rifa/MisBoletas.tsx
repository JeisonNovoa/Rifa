"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconoBoleto } from "@/components/decoracion/Iconos";
import { accionVerificarBoletas } from "@/lib/acciones/reservas";
import {
  extraerIdYToken,
  leerBoletasGuardadas,
  olvidarBoleta,
  type BoletaGuardada,
  type CredencialesBoleta,
} from "@/lib/boletas-guardadas";
import { dosDigitos } from "@/lib/formato";

interface EntradaVerificable {
  boleta: BoletaGuardada;
  credenciales: CredencialesBoleta;
}

/**
 * Recupera las boletas que la persona apartó en este dispositivo
 * (guardadas en localStorage), las verifica contra el servidor y muestra
 * SOLO las que siguen vigentes; las vencidas o liberadas se olvidan aquí
 * mismo para que no queden tarjetas fantasma. Si no queda ninguna, no
 * renderiza nada.
 */
export function MisBoletas() {
  const [boletas, setBoletas] = useState<BoletaGuardada[]>([]);

  useEffect(() => {
    const guardadas = leerBoletasGuardadas();
    if (guardadas.length === 0) return;

    // Entradas corruptas (URL irreconocible): se olvidan de una vez.
    const verificables: EntradaVerificable[] = [];
    for (const boleta of guardadas) {
      const credenciales = extraerIdYToken(boleta.url);
      if (credenciales) {
        verificables.push({ boleta, credenciales });
      } else {
        olvidarBoleta(boleta.numero);
      }
    }
    if (verificables.length === 0) return;

    let activo = true;
    (async () => {
      const resultado = await accionVerificarBoletas(
        verificables.map((entrada) => entrada.credenciales)
      );
      if (!activo) return;

      // Falla temporal verificando: mejor mostrar lo guardado que borrarlo.
      if (resultado === null) {
        setBoletas(verificables.map((entrada) => entrada.boleta));
        return;
      }

      const vigentes = new Set(resultado.vigentes);
      const vivas: BoletaGuardada[] = [];
      for (const entrada of verificables) {
        if (vigentes.has(entrada.credenciales.id)) {
          vivas.push(entrada.boleta);
        } else {
          olvidarBoleta(entrada.boleta.numero);
        }
      }
      setBoletas(vivas);
    })();

    return () => {
      activo = false;
    };
  }, []);

  if (boletas.length === 0) return null;

  return (
    <section
      aria-label="Tus boletas guardadas"
      className="mt-8 rounded-2xl border border-dorado-500/40 bg-dorado-400/[0.06] p-4"
    >
      <p className="flex items-center gap-2 font-titulo text-sm tracking-wide text-dorado-300">
        <IconoBoleto className="h-5 w-5" />
        Tus boletas en este dispositivo
      </p>
      <p className="mt-1 text-xs text-noche-300">
        Retoma el pago o revisa el estado de tu número.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {boletas.map((boleta) => (
          <Link
            key={boleta.numero}
            href={boleta.url}
            className="inline-flex items-center gap-2 rounded-xl border border-noche-700 bg-noche-900/70 px-3 py-2 text-sm font-medium text-crema-50 transition-colors hover:border-dorado-400 hover:text-dorado-300"
          >
            <span className="font-titulo text-lg text-dorado-400">
              {dosDigitos(boleta.numero)}
            </span>
            <span className="text-xs text-noche-300">ver / pagar →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
