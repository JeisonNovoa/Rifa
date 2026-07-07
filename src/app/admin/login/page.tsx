import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormularioLogin } from "@/components/admin/FormularioLogin";
import { SelloRifa } from "@/components/decoracion/SelloRifa";
import { obtenerAdminActual } from "@/lib/auth-admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Ingreso — Panel del organizador",
  robots: { index: false, follow: false },
};

export default async function PaginaLogin() {
  if (await obtenerAdminActual()) redirect("/admin");

  return (
    <main className="flex min-h-dvh items-center justify-center px-5">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-crema-50 text-noche-900 shadow-2xl shadow-noche-950/70">
        <div className="perforado" aria-hidden="true" />
        <div className="px-6 py-8">
          <SelloRifa className="mx-auto w-16 text-rojo-500" />
          <h1 className="mt-4 text-center font-titulo text-2xl">
            Panel del organizador
          </h1>
          <p className="mt-1 text-center text-sm text-noche-900/60">
            Solo para quien administra la rifa.
          </p>
          <FormularioLogin />
        </div>
        <div className="perforado" aria-hidden="true" />
      </div>
    </main>
  );
}
