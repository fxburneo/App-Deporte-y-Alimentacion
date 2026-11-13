import { describe, expect, it } from "vitest";
import { avisoDormir, avisoManana, avisoPeso, avisoRegistrar, avisoResumen, hayFatiga, tipoDelDia } from "@/supabase/functions/avisos/mensajes";
import { avisoPlanCambia } from "@/supabase/functions/tp-sync/mapeo";

const trail = { deporte: "trail_correr", duracion_min: 80, intensidad: "fuerte", estado: "planificado", hora: "05:15:00", nombre: "Run: Trail 1 Cuestas Tempo 2X15" };
const fuerza = { deporte: "fuerza", duracion_min: 20, intensidad: "suave", estado: "planificado", hora: null, nombre: "Strength: Yoga 3" };

describe("tipoDelDia (mismas reglas que el motor)", () => {
  it("cuestas tempo 1:20 es intenso; sin entreno o solo fuerza es descanso; 3 h 30 es largo", () => {
    expect(tipoDelDia([trail, fuerza])).toBe("duro");
    expect(tipoDelDia([fuerza])).toBe("descanso");
    expect(tipoDelDia([{ ...trail, duracion_min: 210, intensidad: "suave" }])).toBe("muy_largo");
  });
});

describe("avisos", () => {
  it("comidas de mañana: tipo de día, entreno, qué cambia y enlace al menú", () => {
    expect(avisoManana("2026-11-17", [trail, fuerza])).toEqual({
      titulo: "Mañana: día intenso",
      cuerpo: "Trail 1:20 a las 05:15. Más carbohidrato: 1 pan con miel antes de entrenar, arroz blanco y 2 tortillas en la cena. Toca para ver el menú.",
      url: "/menu/2026-11-17",
    });
  });
  it("hora de dormir con el entreno de mañana", () => {
    expect(avisoDormir([trail]).cuerpo).toBe("Acuéstate a las 21:30. Mañana: Trail 1:20 a las 05:15.");
    expect(avisoDormir([]).cuerpo).toMatch(/descanso/);
  });
  it("pesaje solo los días que tocan y si todavía no se pesó", () => {
    expect(avisoPeso([1, 3, 5], 1, false)?.url).toBe("/peso");
    expect(avisoPeso([1, 3, 5], 2, false)).toBeNull();
    expect(avisoPeso([1, 3, 5], 5, true)).toBeNull();
  });
  it("registrar a las 15:00 solo si falta el almuerzo", () => {
    expect(avisoRegistrar(["desayuno", "almuerzo"])).toBeNull();
    expect(avisoRegistrar(["desayuno"])?.titulo).toBe("¿Ya almorzaste?");
    expect(avisoRegistrar([])?.url).toBe("/registrar");
  });
  it("resumen de la mañana y fatiga por HRV bajo su rango o sueño corto", () => {
    const b = { sueno_seg: 6.9 * 3600, hrv_noche: 49, hrv_base_bajo: 49, fc_reposo: 53 };
    expect(avisoResumen(b, [trail]).cuerpo).toMatch(/^Dormiste 6,9 h · HRV 49\. Trail 1:20/);
    expect(hayFatiga(b)).toBeNull();
    expect(hayFatiga({ ...b, hrv_noche: 45 })).toBe("HRV 45, bajo tu rango");
    expect(hayFatiga({ ...b, sueno_seg: 5.5 * 3600 })).toBe("dormiste 5,5 h");
  });
  it("cambios del coach solo para hoy y mañana", () => {
    const antes = [{ tp_uid: "a", fecha: "2026-11-13", nombre: "Run: Run Aeróbico" }, { tp_uid: "x", fecha: "2026-11-20", nombre: "Run: Lejos" }];
    const despues = [{ tp_uid: "b", fecha: "2026-11-13", nombre: "Bike: Rodillo Z2" }];
    expect(avisoPlanCambia(antes, despues, "2026-11-13", "2026-11-14")).toEqual({
      titulo: "El coach cambió tu plan",
      cuerpo: "nuevo hoy: Rodillo Z2 · quitado hoy: Run Aeróbico. La comida ya está ajustada.",
      url: "/",
    });
    expect(avisoPlanCambia(antes.slice(0, 1), antes.slice(0, 1), "2026-11-13", "2026-11-14")).toBeNull();
  });
});
