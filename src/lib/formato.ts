/** Utilidades de formato compartidas (funciones puras, sirven en cliente y servidor). */

const formatoPesos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatearPesos(valor: number): string {
  return formatoPesos.format(valor);
}

/** "2026-09-26" → "Sábado 26 de septiembre de 2026" */
export function formatearFechaLarga(fechaIso: string | null): string {
  if (!fechaIso) return "Por definir";
  // Mediodía UTC evita que la fecha se corra un día por zona horaria.
  const fecha = new Date(`${fechaIso}T12:00:00Z`);
  const texto = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(fecha);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "2026-09-26" → "26 de septiembre de 2026" */
export function formatearFechaCorta(fechaIso: string | null): string {
  if (!fechaIso) return "por definir";
  const fecha = new Date(`${fechaIso}T12:00:00Z`);
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(fecha);
}

/** 7 → "07" (los números de la rifa siempre van con dos cifras) */
export function dosDigitos(numero: number): string {
  return numero.toString().padStart(2, "0");
}
