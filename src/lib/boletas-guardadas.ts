/**
 * Memoria de boletas en el navegador (localStorage).
 * Permite recuperar la boleta digital aunque la persona pierda el enlace:
 * al volver a la página, sus números aparecen para retomar el pago.
 *
 * Solo corre en el navegador; guarda lo mínimo (número + enlace).
 */

const CLAVE = "rifa_boletas_guardadas";

export interface BoletaGuardada {
  numero: number;
  url: string; // ruta relativa: /boleta/{id}?t={token}
  guardadaEn: number;
}

function esNavegador(): boolean {
  return typeof window !== "undefined" && "localStorage" in window;
}

export function leerBoletasGuardadas(): BoletaGuardada[] {
  if (!esNavegador()) return [];
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    if (!crudo) return [];
    const lista = JSON.parse(crudo) as BoletaGuardada[];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

/** Guarda (o actualiza) una boleta. Deduplica por número. */
export function guardarBoleta(entrada: BoletaGuardada): void {
  if (!esNavegador()) return;
  try {
    const actuales = leerBoletasGuardadas().filter(
      (b) => b.numero !== entrada.numero
    );
    const nuevas = [entrada, ...actuales].slice(0, 20);
    window.localStorage.setItem(CLAVE, JSON.stringify(nuevas));
  } catch {
    // Almacenamiento lleno o bloqueado: no es crítico, se ignora.
  }
}

export function olvidarBoleta(numero: number): void {
  if (!esNavegador()) return;
  try {
    const nuevas = leerBoletasGuardadas().filter((b) => b.numero !== numero);
    window.localStorage.setItem(CLAVE, JSON.stringify(nuevas));
  } catch {
    // se ignora
  }
}
