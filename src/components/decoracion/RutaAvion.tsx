interface RutaAvionProps {
  className?: string;
}

/** Ruta punteada con avioncito, motivo recurrente del flyer. Decorativa. */
export function RutaAvion({ className = "" }: RutaAvionProps) {
  return (
    <svg viewBox="0 0 340 46" fill="none" aria-hidden="true" className={className}>
      <path
        d="M6 36 C 96 8, 216 48, 302 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="0.5 10"
      />
      {/* Avioncito de papel al final de la ruta */}
      <g transform="translate(306 6) rotate(14)">
        <path d="M0 9 L22 0 L9 11 L11 18 L6 13 L0 9 Z" fill="currentColor" />
      </g>
    </svg>
  );
}
