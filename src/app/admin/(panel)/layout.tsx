import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NavAdmin } from "@/components/admin/NavAdmin";
import { IconoSalir } from "@/components/decoracion/Iconos";
import { SelloRifa } from "@/components/decoracion/SelloRifa";
import { accionCerrarSesion } from "@/lib/acciones/admin";
import { obtenerAdminActual } from "@/lib/auth-admin";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function LayoutPanel({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const correo = await obtenerAdminActual();
  if (!correo) redirect("/admin/login");

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-noche-800 bg-noche-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-3 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <SelloRifa className="w-9 text-dorado-400" />
            <p className="font-titulo text-base leading-tight text-crema-50">
              Panel ·{" "}
              <span className="text-dorado-400">Viaja por Colombia</span>
            </p>
          </div>

          <div className="order-last w-full sm:order-none sm:w-auto">
            <NavAdmin />
          </div>

          <form action={accionCerrarSesion} className="ml-auto">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-full border border-noche-700 px-3.5 py-1.5 text-sm font-medium text-noche-300 transition-colors hover:border-rojo-500/50 hover:text-rojo-400"
            >
              <IconoSalir className="h-4 w-4" />
              Salir
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-8">{children}</main>
    </div>
  );
}
