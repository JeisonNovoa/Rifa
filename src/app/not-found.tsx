import Link from "next/link";
import { SelloRifa } from "@/components/decoracion/SelloRifa";

export default function NoEncontrada() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <SelloRifa className="w-20 -rotate-6 text-dorado-400" />
      <p className="mt-6 font-titulo text-6xl text-dorado-400">¿Te perdiste?</p>
      <h1 className="mt-3 font-titulo text-2xl text-crema-50">
        Esta página no existe
      </h1>
      <p className="mt-3 leading-relaxed text-noche-300">
        Pero el tablero de la rifa sí, y todavía puede haber números libres.
      </p>
      <Link href="/" className="btn-dorado mt-6">
        Ir a la rifa
      </Link>
    </main>
  );
}
