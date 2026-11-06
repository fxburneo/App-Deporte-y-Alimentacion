// Nueva carrera (maqueta 4b.2).
import { connection } from "next/server";
import Pantalla from "@/components/Pantalla";
import { hoyEcuador, sumarDias } from "@/lib/fecha";
import FormCarrera from "../FormCarrera";

export default async function Page() {
  await connection(); // la fecha sugerida se calcula al abrir, no al compilar
  return (
    <Pantalla conNav={false}>
      <FormCarrera
        inicial={{ nombre: "", fecha: sumarDias(hoyEcuador(), 60), deporte: "trail", distancia_km: null, desnivel_m: null, horas_min: 3, horas_max: 4, prioridad: "B" }}
      />
    </Pantalla>
  );
}
