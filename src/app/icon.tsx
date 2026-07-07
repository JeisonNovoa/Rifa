import { ImageResponse } from "next/og";

/** Favicon generado: las montañitas del sello sobre azul noche. */
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icono() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#101f3c",
          borderRadius: 14,
        }}
      >
        <svg width="46" height="46" viewBox="0 0 100 100">
          <path
            d="M18 64 L38 34 L51 49 L63 30 L82 64"
            stroke="#F5B914"
            strokeWidth="9"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 64 H86"
            stroke="#F5B914"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    size
  );
}
