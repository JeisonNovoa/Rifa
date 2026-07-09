"use client";

/** Recarga la página actual conservando la URL (y el token de la boleta). */
export function BotonReintentar({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className={`btn-dorado ${className}`}
    >
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
  );
}
