import { describe, expect, it } from "vitest";
import { deporteTP, duracionPlanificada, eventoAEntreno, intensidadTP, leerEventos, unirCarreras, type EventoIcal } from "@/supabase/functions/tp-sync/mapeo";

// Fragmento con el formato real del enlace "Workouts" de TrainingPeaks.
const ICAL = [
  "BEGIN:VCALENDAR",
  "METHOD:PUBLISH",
  "VERSION:2.0",
  "BEGIN:VEVENT",
  "DESCRIPTION:Workout type: Bike\\nPlanned Time: 1:15\\n",
  "DTEND;VALUE=DATE:20261114",
  "DTSTAMP:20261106T195847Z",
  "DTSTART;VALUE=DATE:20261113",
  "SEQUENCE:0",
  "SUMMARY:Bike: Potencia Cadencia Aeróbico Intervalos 10min 2",
  "UID:abc-1",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "DESCRIPTION:Workout type: Walk\\nTrekking con la mochila\\, ir a paso suave",
  " \\, no correr.\\nPlanned Time: 5:00\\nDistance Planned: 44.8 km\\n",
  "DTSTART;VALUE=DATE:20261115",
  "SUMMARY:Walk: Trekking 1500m+ AR",
  "UID:abc-2",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "DESCRIPTION:Workout type: Day Off\\n",
  "DTSTART;VALUE=DATE:20261116",
  "SUMMARY:Day Off: Descanso Total",
  "UID:abc-3",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");

const ev = (resumen: string, descripcion: string, fecha = "2026-11-12"): EventoIcal => ({ uid: "x", fecha, resumen, descripcion });
const horarios = { semana: "05:00", finde: "06:30" };

describe("leerEventos", () => {
  it("lee fecha, título y descripción, y junta las líneas plegadas", () => {
    const e = leerEventos(ICAL);
    expect(e).toHaveLength(3);
    expect(e[0]).toMatchObject({ uid: "2026-11-13|Bike: Potencia Cadencia Aeróbico Intervalos 10min 2", fecha: "2026-11-13", resumen: "Bike: Potencia Cadencia Aeróbico Intervalos 10min 2" });
    expect(e[1].descripcion).toContain("Trekking con la mochila, ir a paso suave, no correr.");
    expect(e[1].descripcion).toContain("Planned Time: 5:00");
  });
});

describe("clave estable", () => {
  it("la clave no depende del UID de TrainingPeaks (cambia en cada lectura) y numera títulos repetidos el mismo día", () => {
    const otraLectura = ICAL.replace(/UID:abc-/g, "UID:zzz-");
    expect(leerEventos(otraLectura).map((e) => e.uid)).toEqual(leerEventos(ICAL).map((e) => e.uid));
    const doble = ICAL.replace("SUMMARY:Day Off: Descanso Total", "SUMMARY:Walk: Trekking 1500m+ AR").replace("DTSTART;VALUE=DATE:20261116", "DTSTART;VALUE=DATE:20261115");
    expect(leerEventos(doble).map((e) => e.uid).slice(1)).toEqual(["2026-11-15|Walk: Trekking 1500m+ AR", "2026-11-15|Walk: Trekking 1500m+ AR|2"]);
  });
});

describe("duracionPlanificada", () => {
  it("convierte horas:minutos", () => {
    expect(duracionPlanificada("Workout type: Run\nPlanned Time: 1:02\n")).toBe(62);
    expect(duracionPlanificada("Planned Time: 0:20:30")).toBe(21);
  });
  it("sin tiempo planificado es 0", () => {
    expect(duracionPlanificada("Workout type: Run\nEstiramientos")).toBe(0);
  });
});

describe("deporteTP", () => {
  it("bici entre semana es rodillo; el fin de semana, ruta", () => {
    expect(deporteTP(ev("Bike: Fondo", "Workout type: Bike", "2026-11-13"))).toBe("rodillo"); // viernes
    expect(deporteTP(ev("Bike: Fondo", "Workout type: Bike", "2026-11-14"))).toBe("ruta_mtb"); // sábado
    expect(deporteTP(ev("Bike: FTP", "Workout type: Bike\nRecuerda quitar el ERG Mode al rodillo", "2026-11-14"))).toBe("rodillo");
  });
  it("traduce los demás tipos del coach", () => {
    expect(deporteTP(ev("MTB: Cross Country", "Workout type: MTB"))).toBe("ruta_mtb");
    expect(deporteTP(ev("Run: AA Skipping", "Workout type: Run"))).toBe("trail_correr");
    expect(deporteTP(ev("Walk: Trekking", "Workout type: Walk"))).toBe("trail_correr");
    expect(deporteTP(ev("Strength: Yoga 3", "Workout type: Strength"))).toBe("fuerza");
    expect(deporteTP(ev("Day Off: Descanso Total", "Workout type: Day Off"))).toBe("descanso");
    expect(deporteTP(ev("Swim: Técnica", "Workout type: Swim"))).toBeNull();
  });
});

describe("intensidadTP", () => {
  it("prueba de FTP es fuerte; intervalos y sprints, moderado; el resto, suave", () => {
    expect(intensidadTP(ev("Bike: Evaluación Functional Thershold Power FTP (Potencia)", ""))).toBe("fuerte");
    expect(intensidadTP(ev("Run: Fuerza Sprint 2 (4X10seg)", ""))).toBe("moderado");
    expect(intensidadTP(ev("Bike: Potencia Cadencia Aeróbico Intervalos 10min 2", ""))).toBe("moderado");
    expect(intensidadTP(ev("MTB: Cross Country", "Técnica general"))).toBe("suave");
  });
  it("la descripción sube a fuerte solo si pide zonas altas", () => {
    expect(intensidadTP(ev("Run: Rodaje", "Trote suave Z1-Z2"))).toBe("suave");
    expect(intensidadTP(ev("Run: Bloques", "3 x 8 min en Z4"))).toBe("fuerte");
  });
});

describe("eventoAEntreno", () => {
  it("arma la fila del plan con la hora habitual del perfil", () => {
    const [bici, trekking, descanso] = leerEventos(ICAL).map((e) => eventoAEntreno(e, "u1", horarios));
    expect(bici).toMatchObject({ tp_uid: "2026-11-13|Bike: Potencia Cadencia Aeróbico Intervalos 10min 2", fecha: "2026-11-13", hora: "05:00", estado: "planificado", deporte: "rodillo", duracion_min: 75, intensidad: "moderado", origen: "trainingpeaks" });
    expect(trekking).toMatchObject({ hora: "06:30", deporte: "trail_correr", duracion_min: 300, intensidad: "suave" });
    expect(descanso).toMatchObject({ hora: null, deporte: "descanso", duracion_min: 0 });
  });
  it("tipos que no cuentan para la nutrición no se guardan", () => {
    expect(eventoAEntreno(ev("Swim: Técnica", "Workout type: Swim"), "u1", horarios)).toBeNull();
  });
});

describe("unirCarreras", () => {
  const petzl = { id: 1, nombre: "Petzl 50K", fecha: "2027-04-03", tp_uid: null };
  it("enlaza la carrera cuando aparece en el calendario con el mismo nombre", () => {
    const evs = [ev("Run: Petzl 50K", "Workout type: Run\nPlanned Time: 9:00", "2027-04-03")].map((e) => ({ ...e, uid: "tp-9" }));
    expect(unirCarreras(evs, [petzl])).toEqual([{ id: 1, tp_uid: "tp-9", fecha: "2027-04-03" }]);
  });
  it("si el coach la movió un día, actualiza la fecha", () => {
    const evs = [{ ...ev("Race: PETZL Trail", "", "2027-04-04"), uid: "tp-9" }];
    expect(unirCarreras(evs, [petzl])).toEqual([{ id: 1, tp_uid: "tp-9", fecha: "2027-04-04" }]);
  });
  it("no enlaza entrenos de otro nombre ni fechas lejanas, y no repite si ya está unida", () => {
    expect(unirCarreras([{ ...ev("Run: Fondo 50K", "", "2027-04-03"), uid: "a" }], [petzl])).toEqual([]);
    expect(unirCarreras([{ ...ev("Run: Petzl 50K", "", "2027-03-20"), uid: "a" }], [petzl])).toEqual([]);
    expect(unirCarreras([{ ...ev("Run: Petzl 50K", "", "2027-04-03"), uid: "a" }], [{ ...petzl, tp_uid: "a" }])).toEqual([]);
  });
});
