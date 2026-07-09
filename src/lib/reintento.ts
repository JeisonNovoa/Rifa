import 'server-only';

/**
 * Reintenta una operación que puede fallar por errores transitorios de red
 * (sockets fríos al despertar la máquina, parpadeos de conexión a Supabase).
 * Patrón observado en producción: el primer intento falla, el segundo pasa.
 */
export async function conReintento<T>(
  operacion: () => Promise<T>,
  intentos = 2,
  esperaMs = 350
): Promise<T> {
  let ultimoError: unknown;
  for (let intento = 1; intento <= intentos; intento++) {
    try {
      return await operacion();
    } catch (error: unknown) {
      ultimoError = error;
      if (intento < intentos) {
        console.error(
          `Intento ${intento}/${intentos} falló, reintentando:`,
          error instanceof Error ? error.message : error
        );
        await new Promise((listo) => setTimeout(listo, esperaMs));
      }
    }
  }
  throw ultimoError;
}
