"use client";

import { useEffect, useMemo, useState } from "react";
import { dosDigitos } from "@/lib/formato";
import type { CasillaTablero } from "@/lib/types";
import { BarraSeleccion } from "./BarraSeleccion";
import { CasillaNumero } from "./CasillaNumero";
import { usarTableroEnVivo } from "./usarTableroEnVivo";

interface TableroNumerosProps {
  inicial: CasillaTablero[];
  raffleId: string;
  precio: number;
  minutosReserva: number;
}

export function TableroNumeros({
  inicial,
  raffleId,
  precio,
  minutosReserva,
}: TableroNumerosProps) {
  const casillas = usarTableroEnVivo(inicial);
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const conteos = useMemo(
    () => ({
      disponibles: casillas.filter((c) => c.estado === "disponible").length,
      apartados: casillas.filter(
        (c) =>
          c.estado === "reservado" ||
          c.estado === "en_revision" ||
          c.estado === "abonado"
      ).length,
      vendidos: casillas.filter((c) => c.estado === "vendido").length,
    }),
    [casillas]
  );

  // Si el número elegido se lo llevan mientras el usuario lo piensa, se suelta.
  useEffect(() => {
    if (seleccion === null) return;
    const casilla = casillas.find((c) => c.numero === seleccion);
    if (casilla && casilla.estado !== "disponible") {
      setSeleccion(null);
      setAviso(`El ${dosDigitos(seleccion)} se acaba de apartar. ¡Escoge otro!`);
    }
  }, [casillas, seleccion]);

  const alSeleccionar = (numero: number) => {
    setAviso(null);
    setSeleccion((actual) => (actual === numero ? null : numero));
  };

  return (
    <div>
      {/* Leyenda con conteos en vivo */}
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-noche-300">
        <MuestraLeyenda
          clase="border-noche-600 bg-noche-900"
          texto={`${conteos.disponibles} libres`}
        />
        <MuestraLeyenda
          clase="border-noche-800 bg-noche-900/50"
          texto={`${conteos.apartados} apartados`}
        />
        <MuestraLeyenda
          clase="border-rojo-500/30 bg-rojo-500/10"
          texto={`${conteos.vendidos} vendidos`}
        />
      </div>

      <p
        aria-live="polite"
        className="mb-3 min-h-5 text-sm font-medium text-dorado-300"
      >
        {aviso}
      </p>

      <div className="animar-entrada grid grid-cols-5 gap-2 sm:grid-cols-10 sm:gap-2.5">
        {casillas.map((casilla) => (
          <CasillaNumero
            key={casilla.numero}
            numero={casilla.numero}
            estado={casilla.estado}
            seleccionado={seleccion === casilla.numero}
            onSeleccionar={alSeleccionar}
          />
        ))}
      </div>

      <BarraSeleccion
        numero={seleccion}
        raffleId={raffleId}
        precio={precio}
        minutosReserva={minutosReserva}
        onQuitar={() => setSeleccion(null)}
      />
    </div>
  );
}

function MuestraLeyenda({ clase, texto }: { clase: string; texto: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden="true" className={`h-3.5 w-3.5 rounded border ${clase}`} />
      {texto}
    </span>
  );
}
