"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconoCuadricula,
  IconoEngranaje,
  IconoExterno,
  IconoResumen,
  type IconoProps,
} from "@/components/decoracion/Iconos";

interface Pestana {
  href: string;
  etiqueta: string;
  Icono: (props: IconoProps) => React.ReactNode;
}

const PESTANAS: Pestana[] = [
  { href: "/admin", etiqueta: "Resumen", Icono: IconoResumen },
  { href: "/admin/numeros", etiqueta: "Números", Icono: IconoCuadricula },
  { href: "/admin/configuracion", etiqueta: "Ajustes", Icono: IconoEngranaje },
];

/** Navegación del panel con pestañas tipo píldora que marcan la activa. */
export function NavAdmin() {
  const ruta = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1.5">
      {PESTANAS.map(({ href, etiqueta, Icono }) => {
        const activa =
          href === "/admin" ? ruta === "/admin" : ruta.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={activa ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              activa
                ? "bg-dorado-400 text-noche-950"
                : "text-noche-300 hover:bg-noche-800 hover:text-crema-50"
            }`}
          >
            <Icono className="h-4 w-4" />
            {etiqueta}
          </Link>
        );
      })}
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium text-noche-300 transition-colors hover:bg-noche-800 hover:text-crema-50"
      >
        Ver página
        <IconoExterno className="h-3.5 w-3.5" />
      </a>
    </nav>
  );
}
