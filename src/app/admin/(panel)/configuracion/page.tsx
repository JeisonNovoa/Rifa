import { FormularioConfiguracion } from "@/components/admin/FormularioConfiguracion";
import { SeccionSorteo } from "@/components/admin/SeccionSorteo";
import { obtenerInfoGanador } from "@/lib/datos/ganador";
import { obtenerRifaPublica } from "@/lib/datos/rifa";

export const dynamic = "force-dynamic";

export default async function PaginaConfiguracion() {
  const rifa = await obtenerRifaPublica();
  const ganador = await obtenerInfoGanador(rifa.numero_ganador);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-titulo text-3xl text-crema-50">Configuración</h1>
        <p className="mt-2 max-w-xl text-sm text-noche-300">
          Todo lo de esta página se puede cambiar con la rifa andando: la
          página pública y las boletas se actualizan al instante.
        </p>
      </div>
      <SeccionSorteo rifa={rifa} ganador={ganador} />
      <FormularioConfiguracion rifa={rifa} />
    </div>
  );
}
