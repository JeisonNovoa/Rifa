import "server-only";
import { createClient } from "@supabase/supabase-js";
import { conReintento } from "@/lib/reintento";
import type { CasillaTablero, RifaPublica } from "@/lib/types";

/**
 * Lecturas públicas de la rifa (solo vistas sin datos personales).
 * Usa la llave publishable: aunque corre en el servidor, no necesita
 * privilegios — las vistas `rifa_publica` y `tablero` son públicas.
 */
function clientePublico() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const llave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !llave) {
    throw new Error(
      "Faltan las variables de entorno de Supabase. Revisa .env.local (guíate de .env.example)."
    );
  }
  return createClient(url, llave, { auth: { persistSession: false } });
}

export async function obtenerRifaPublica(): Promise<RifaPublica> {
  return conReintento(async () => {
    const { data, error } = await clientePublico()
      .from("rifa_publica")
      .select("*")
      .single();
    if (error) {
      throw new Error(`No se pudo cargar la rifa: ${error.message}`);
    }
    return data as RifaPublica;
  });
}

export async function obtenerTablero(): Promise<CasillaTablero[]> {
  return conReintento(async () => {
    const { data, error } = await clientePublico()
      .from("tablero")
      .select("raffle_id, numero, estado, reservado_hasta")
      .order("numero", { ascending: true });
    if (error) {
      throw new Error(`No se pudo cargar el tablero: ${error.message}`);
    }
    return (data ?? []) as CasillaTablero[];
  });
}
