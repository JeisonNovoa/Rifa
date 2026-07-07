import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
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
      <header className="border-b border-noche-800 bg-noche-900/60">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4">
          <p className="font-titulo text-lg text-crema-50">
            Panel · <span className="text-dorado-400">Viaja por Colombia</span>
          </p>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-noche-300">
            <Link href="/admin" className="transition-colors hover:text-crema-50">
              Resumen
            </Link>
            <Link
              href="/admin/numeros"
              className="transition-colors hover:text-crema-50"
            >
              Números
            </Link>
            <Link
              href="/admin/configuracion"
              className="transition-colors hover:text-crema-50"
            >
              Configuración
            </Link>
            <Link
              href="/"
              target="_blank"
              className="transition-colors hover:text-crema-50"
            >
              Ver página ↗
            </Link>
          </nav>
          <form action={accionCerrarSesion} className="ml-auto">
            <button
              type="submit"
              className="text-sm font-medium text-noche-400 transition-colors hover:text-crema-50"
            >
              Salir
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-8">{children}</main>
    </div>
  );
}
