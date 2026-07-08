"use client";

import { useRef, useState } from "react";

/**
 * Reemplaza el window.confirm() antes de enviar un formulario:
 * intercepta el submit, abre el diálogo bonito y solo envía si se confirma.
 *
 * Uso:
 *   const conf = usarConfirmacion();
 *   <form ref={conf.formRef} action={enviar} onSubmit={conf.alEnviar}>…</form>
 *   <DialogoConfirmar abierto={conf.abierto} … onConfirmar={conf.confirmar}
 *     onCancelar={conf.cancelar} />
 */
export function usarConfirmacion() {
  const [abierto, setAbierto] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return {
    abierto,
    formRef,
    /** Pásalo al onSubmit del <form> */
    alEnviar(evento: React.FormEvent<HTMLFormElement>) {
      if (!abierto) {
        evento.preventDefault();
        setAbierto(true);
      }
    },
    /** onConfirmar del diálogo */
    confirmar() {
      setAbierto(false);
      formRef.current?.requestSubmit();
    },
    /** onCancelar del diálogo */
    cancelar() {
      setAbierto(false);
    },
  };
}
