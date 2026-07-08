import { formatearPesos } from "@/lib/formato";

interface BarraProgresoProps {
  abonado: number;
  precio: number;
  className?: string;
}

/** Barra de progreso del pago de una boleta. */
export function BarraProgreso({ abonado, precio, className = "" }: BarraProgresoProps) {
  const porcentaje = Math.min(100, Math.round((abonado / precio) * 100));
  const restante = Math.max(0, precio - abonado);

  return (
    <div className={className}>
      <div
        role="progressbar"
        aria-valuenow={porcentaje}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Has pagado ${formatearPesos(abonado)} de ${formatearPesos(precio)}`}
        className="h-3 overflow-hidden rounded-full border border-noche-700 bg-noche-900"
      >
        <div
          className="h-full rounded-full bg-dorado-400 transition-[width] duration-500"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-noche-300">
        Has abonado{" "}
        <strong className="font-titulo text-dorado-400">
          {formatearPesos(abonado)}
        </strong>{" "}
        de {formatearPesos(precio)}
        {restante > 0 && (
          <>
            {" "}
            · te faltan{" "}
            <strong className="font-semibold text-crema-50">
              {formatearPesos(restante)}
            </strong>
          </>
        )}
      </p>
    </div>
  );
}
