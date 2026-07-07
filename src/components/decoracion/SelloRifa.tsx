interface SelloRifaProps {
  className?: string;
}

/** Sello circular de la marca, como el timbre del flyer. Hereda color con `currentColor`. */
export function SelloRifa({ className = "" }: SelloRifaProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label="Sello de la rifa Viaja por Colombia"
      className={className}
    >
      <defs>
        <path
          id="sello-circulo"
          d="M50,50 m-35,0 a35,35 0 1,1 70,0 a35,35 0 1,1 -70,0"
          fill="none"
        />
      </defs>
      <circle cx="50" cy="50" r="47.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeDasharray="2 3"
        opacity="0.7"
      />
      <text
        fill="currentColor"
        fontSize="9"
        letterSpacing="1.5"
        style={{ fontFamily: "var(--font-titulo)" }}
      >
        <textPath href="#sello-circulo">VIAJA POR COLOMBIA · RIFA ·</textPath>
      </text>
      {/* Montañitas */}
      <path
        d="M30 61 L40 47 L47 56 L56 43 L69 61"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M27 61 H73" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <text
        x="50"
        y="76"
        textAnchor="middle"
        fill="currentColor"
        fontSize="11"
        letterSpacing="2"
        style={{ fontFamily: "var(--font-titulo)" }}
      >
        00–99
      </text>
    </svg>
  );
}
