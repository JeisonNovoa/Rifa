"use client";

/**
 * Respaldo de último recurso: si falla hasta el layout raíz, Next muestra
 * esto. No hay Tailwind garantizado aquí, así que va con estilos en línea.
 */
export default function ErrorGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          background: "#101f3c",
          color: "#f7f1e3",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <p style={{ fontSize: "44px", margin: 0 }}>🎟️</p>
        <h1 style={{ fontSize: "22px", margin: 0 }}>
          Algo falló de nuestro lado
        </h1>
        <p style={{ margin: 0, color: "#aebad1", maxWidth: "420px" }}>
          Tu número y tus pagos están a salvo. Dale reintentar en unos
          segundos.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "12px",
            background: "#F5B914",
            color: "#101f3c",
            border: "none",
            borderRadius: "12px",
            padding: "12px 24px",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
        {error.digest && (
          <p style={{ fontSize: "11px", color: "#6b7a99" }}>
            {`Código: ${error.digest}`}
          </p>
        )}
      </body>
    </html>
  );
}
