/**
 * Set de íconos de la marca (SVG en línea, heredan color con currentColor).
 * Trazos redondeados de 1.8 para que combinen con la tipografía del cartel.
 */

interface IconoProps {
  className?: string;
}

function Lienzo({
  className = "",
  children,
  relleno = false,
}: IconoProps & { children: React.ReactNode; relleno?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill={relleno ? "currentColor" : "none"}
      stroke={relleno ? "none" : "currentColor"}
      strokeWidth={relleno ? undefined : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/** Boleta de rifa con muesca */
export function IconoBoleto({ className }: IconoProps) {
  return (
    <Lienzo className={className}>
      <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4Z" />
      <path d="M14.5 6v2.2M14.5 11v2M14.5 15.8V18" strokeDasharray="0.1 3" />
    </Lienzo>
  );
}

export function IconoCopiar({ className }: IconoProps) {
  return (
    <Lienzo className={className}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </Lienzo>
  );
}

export function IconoListo({ className }: IconoProps) {
  return (
    <Lienzo className={className}>
      <path d="M5 13l4.2 4.2L19 7.4" />
    </Lienzo>
  );
}

export function IconoWhatsApp({ className }: IconoProps) {
  return (
    <Lienzo className={className} relleno>
      <path d="M12 2a10 10 0 0 0-8.66 15L2 22l5.15-1.3A10 10 0 1 0 12 2Zm0 1.9a8.1 8.1 0 1 1-4.12 15.07l-.3-.18-3.06.77.8-2.98-.2-.31A8.1 8.1 0 0 1 12 3.9ZM8.9 7.6c-.18 0-.47.07-.72.34-.24.27-.94.92-.94 2.24 0 1.32.96 2.6 1.1 2.78.13.18 1.86 2.95 4.58 4.02 2.26.9 2.72.72 3.21.67.5-.04 1.6-.65 1.82-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.32l-1.84-.88c-.25-.12-.43-.09-.6.13l-.75.94c-.14.18-.31.2-.55.09a6.63 6.63 0 0 1-3.3-2.88c-.1-.2-.01-.36.1-.5l.55-.68c.14-.17.18-.36.09-.56l-.83-2.02c-.16-.4-.34-.8-.56-.81Z" />
    </Lienzo>
  );
}

export function IconoLlave({ className }: IconoProps) {
  return (
    <Lienzo className={className}>
      <circle cx="7.5" cy="14.5" r="3.5" />
      <path d="M10.5 12 19 4M15 8l2.5 2.5M12.5 10.5l2 2" />
    </Lienzo>
  );
}

export function IconoCelular({ className }: IconoProps) {
  return (
    <Lienzo className={className}>
      <rect x="7.5" y="3" width="9" height="18" rx="2" />
      <path d="M11 17.8h2" />
    </Lienzo>
  );
}

export function IconoDescargar({ className }: IconoProps) {
  return (
    <Lienzo className={className}>
      <path d="M12 4v10m0 0-4-4m4 4 4-4M5 19h14" />
    </Lienzo>
  );
}

export function IconoFlechaAbajo({ className }: IconoProps) {
  return (
    <Lienzo className={className}>
      <path d="M12 5v13m0 0-5-5m5 5 5-5" />
    </Lienzo>
  );
}
