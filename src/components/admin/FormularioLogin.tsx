"use client";

import { useActionState } from "react";
import { accionIniciarSesion, type EstadoAdmin } from "@/lib/acciones/admin";

const ESTADO_INICIAL: EstadoAdmin = {};

const ESTILO_INPUT =
  "w-full rounded-lg border border-noche-900/20 bg-white/70 px-3 py-2.5 text-sm text-noche-900 placeholder:text-noche-900/35 focus:border-noche-900/50 focus:outline-none disabled:opacity-60";

export function FormularioLogin() {
  const [estado, enviar, pendiente] = useActionState(
    accionIniciarSesion,
    ESTADO_INICIAL
  );

  return (
    <form action={enviar} className="mt-5 space-y-4">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-noche-900/60">
          Correo
        </span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@correo.com"
          disabled={pendiente}
          className={ESTILO_INPUT}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-noche-900/60">
          Contraseña
        </span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          disabled={pendiente}
          className={ESTILO_INPUT}
        />
      </label>

      {estado.error && (
        <p role="alert" className="text-sm font-medium text-rojo-500">
          {estado.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pendiente}
        className="btn-dorado w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pendiente ? "Entrando…" : "Entrar al panel"}
      </button>
    </form>
  );
}
