import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy (el "middleware" de Next 16) para las rutas del panel de admin.
 * Su único trabajo es refrescar la sesión de Supabase antes de renderizar:
 * sin esto, el login del organizador se vencería cada hora.
 */
export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const llave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !llave) return respuesta;

  const supabase = createServerClient(url, llave, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesPorEscribir) {
        cookiesPorEscribir.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        respuesta = NextResponse.next({ request });
        cookiesPorEscribir.forEach(({ name, value, options }) =>
          respuesta.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresca el token si está por vencer y persiste las cookies nuevas.
  await supabase.auth.getUser();

  return respuesta;
}

export const config = {
  matcher: ["/admin/:path*"],
};
