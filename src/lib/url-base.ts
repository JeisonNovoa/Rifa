import 'server-only';
import { headers } from 'next/headers';

/** URL base de la petición actual (para armar enlaces compartibles). */
export async function obtenerUrlBase(): Promise<string> {
  const encabezados = await headers();
  const host = encabezados.get('host') ?? 'localhost:3000';
  const protocolo =
    encabezados.get('x-forwarded-proto') ??
    (host.startsWith('localhost') ? 'http' : 'https');
  return `${protocolo}://${host}`;
}
