import { ImageResponse } from "next/og";
import { obtenerRifaPublica } from "@/lib/datos/rifa";
import { formatearFechaCorta, formatearPesos } from "@/lib/formato";

/**
 * Imagen que se ve al compartir el enlace por WhatsApp / redes.
 * Se genera con los datos reales de la rifa (con respaldo estático si falla).
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "Rifa Viaja por Colombia: gánate un viaje para 2 personas + $500.000 de viáticos";

const ORO = "#F5B914";
const CREMA = "#F7F1E3";
const NOCHE = "#101f3c";

export default async function ImagenParaCompartir() {
  let precio = "$ 60.000";
  let fecha = "26 de septiembre de 2026";
  try {
    const rifa = await obtenerRifaPublica();
    precio = formatearPesos(rifa.precio_por_numero);
    fecha = formatearFechaCorta(rifa.fecha_sorteo);
  } catch {
    // Valores de respaldo: la imagen sale igual de bien.
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: NOCHE,
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            color: ORO,
            fontSize: 28,
            letterSpacing: 10,
            fontWeight: 700,
          }}
        >
          RIFA · SOLO UN GANADOR
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              color: CREMA,
              fontSize: 130,
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            VIAJA POR
          </div>
          <div
            style={{
              display: "flex",
              color: ORO,
              fontSize: 120,
              fontWeight: 800,
              fontStyle: "italic",
              lineHeight: 1.05,
            }}
          >
            Colombia
          </div>
          <div
            style={{
              display: "flex",
              color: "#aebad1",
              fontSize: 34,
              marginTop: 18,
            }}
          >
            Gánate un viaje para 2 personas + $500.000 de viáticos
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              background: ORO,
              color: NOCHE,
              fontSize: 30,
              fontWeight: 700,
              padding: "14px 28px",
              borderRadius: 16,
            }}
          >
            {`Boleta ${precio}`}
          </div>
          <div style={{ display: "flex", color: CREMA, fontSize: 28 }}>
            {`Sorteo ${fecha} · Lotería de Boyacá`}
          </div>
        </div>
      </div>
    ),
    size
  );
}
