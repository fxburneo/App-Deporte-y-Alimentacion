import { describe, expect, it } from "vitest";
import type { AlimentoDespensa } from "@/lib/despensa/calculos";
import { arrozDelDia, escalarPlato, menuDurante, menuPre, textoMenu } from "./escalar";
import { listaCompras } from "./compras";

const d = (id: number, nombre: string, categoria: AlimentoDespensa["categoria"], c: number, p: number, g: number, porcion: number, porcionNombre: string, unidad: number | null, unidadNombre: string | null): AlimentoDespensa => ({
  id, nombre, marca: null, tipo: "generico", categoria, carbo_100: c, proteina_100: p, grasa_100: g, porcion_g: porcion, porcion_nombre: porcionNombre, unidad_g: unidad, unidad_nombre: unidadNombre,
});
// Despensa de Francisco (valores reales de la app).
const despensa = [
  d(1, "Pechuga de pollo cocida", "proteina", 0, 31, 3.6, 150, "1 pechuga", 150, "pechuga"),
  d(3, "Huevo entero", "proteina", 1.1, 12.6, 9.5, 50, "1 huevo", 50, "huevo"),
  d(6, "Leche descremada", "mixto", 5, 3.4, 0.2, 250, "1 taza", 250, "taza"),
  d(7, "Arroz blanco cocido", "carbo", 28, 2.7, 0.3, 160, "1 taza", 160, "taza"),
  d(13, "Banano", "carbo", 23, 1.1, 0.3, 120, "1 banano", 120, "banano"),
  d(14, "Papaya", "carbo", 11, 0.5, 0.3, 150, "1 taza", 150, "taza"),
  d(16, "Aceite de oliva o girasol", "grasa", 0, 0, 100, 5, "1 cucharadita", 5, "cucharadita"),
  d(18, "Ensalada verde (lechuga, tomate, pepino)", "libre", 3.5, 1, 0.2, 100, "1 plato", null, null),
  d(20, "Pan de agua precocido", "carbo", 51.4, 8.6, 5.7, 35, "1 pan", 35, "pan"),
  d(21, "Gel energético", "carbo", 78, 0, 0, 32, "1 gel", 32, "gel"),
  d(22, "Bebida isotónica", "carbo", 6, 0, 0, 500, "1 botella", 500, "botella"),
  d(24, "Queso light", "proteina", 2, 23, 10, 30, "1 tajada", 30, "tajada"),
  d(25, "Galletas integrales", "carbo", 65, 9, 15, 32, "4 galletas", 8, "galleta"),
  d(27, "Arroz integral cocido", "carbo", 23, 2.6, 0.9, 160, "1 taza", 160, "taza"),
  d(28, "Tortilla de trigo (wrap)", "carbo", 50, 8, 8, 60, "1 tortilla", 60, "tortilla"),
  d(29, "Piña", "carbo", 13, 0.5, 0.1, 165, "1 taza", 165, "taza"),
  d(31, "Miel de abeja", "carbo", 82, 0.3, 0, 21, "1 cucharada", 21, "cucharada"),
  d(32, "Café pintado", "libre", 2, 1.4, 0.1, 250, "1 taza", 250, "taza"),
];
const a = (nombre: string, gramos: number, medida: string, c: number, p: number, g: number, detalle = "") => ({ nombre, detalle, gramos, medida_casera: medida, carbo_g: c, proteina_g: p, grasa_g: g });
const almuerzo = [
  a("Pechuga de pollo cocida", 200, "1 pechuga grande", 0, 62, 7.2),
  a("Arroz integral cocido", 200, "1 ¼ taza", 46, 5.2, 1.8),
  a("Ensalada verde (lechuga, tomate, pepino)", 100, "a gusto", 3.5, 1, 0.2),
  a("Aceite de oliva o girasol", 5, "1 cucharadita", 0, 0, 5),
];
const desayuno = [
  a("Huevo entero", 100, "2 huevos", 1.1, 12.6, 9.5),
  a("Pan de agua precocido", 70, "2 panes", 36, 6, 4),
  a("Queso light", 30, "1 tajada", 0.6, 6.9, 3),
  a("Leche descremada", 250, "1 taza", 12.5, 8.5, 0.5),
  a("Papaya", 150, "1 taza", 16.5, 0.8, 0.5),
  a("Café pintado", 250, "1 taza", 5, 3.5, 0.3),
];

describe("arrozDelDia", () => {
  it("integral en descanso y Z2; blanco en días exigentes y de carga", () => {
    expect(arrozDelDia("descanso")).toBe("integral");
    expect(arrozDelDia("suave")).toBe("integral");
    expect(arrozDelDia("duro")).toBe("blanco");
    expect(arrozDelDia("muy_largo")).toBe("blanco");
    expect(arrozDelDia("suave", true)).toBe("blanco");
  });
});

describe("escalarPlato", () => {
  it("almuerzo de descanso: el pollo no cambia y el arroz integral baja a ¾ taza", () => {
    const r = escalarPlato(almuerzo, { carboG: 32, proteinaG: 68, grasaG: 10 }, despensa, "descanso");
    expect(r.find((x) => x.nombre.startsWith("Pechuga"))).toMatchObject({ gramos: 200, varia: false });
    expect(r.find((x) => x.nombre.startsWith("Arroz"))).toMatchObject({ nombre: "Arroz integral cocido", medida_casera: "¾ taza", varia: true });
  });
  it("almuerzo de día intenso: cambia a arroz BLANCO con más cantidad", () => {
    const r = escalarPlato(almuerzo, { carboG: 72, proteinaG: 68, grasaG: 10 }, despensa, "duro");
    const arroz = r.find((x) => x.nombre.startsWith("Arroz"))!;
    expect(arroz.nombre).toBe("Arroz blanco cocido");
    expect(arroz.medida_casera).toBe("1 ½ tazas");
  });
  it("desayuno: lo fijo queda igual y los panes van de 1 a 3 según el día", () => {
    const descanso = escalarPlato(desayuno, { carboG: 32, proteinaG: 34, grasaG: 18 }, despensa, "descanso");
    const largo = escalarPlato(desayuno, { carboG: 95, proteinaG: 34, grasaG: 18 }, despensa, "muy_largo");
    expect(descanso.find((x) => x.nombre.startsWith("Pan"))!.medida_casera).toBe("1 pan");
    expect(largo.find((x) => x.nombre.startsWith("Pan"))!.medida_casera).toBe("3 panes");
    expect(descanso.find((x) => x.nombre.startsWith("Huevo"))!.medida_casera).toBe("2 huevos");
  });
  it("texto corto del menú", () => {
    expect(textoMenu(escalarPlato(almuerzo, { carboG: 32, proteinaG: 68, grasaG: 10 }, despensa, "descanso"))).toBe(
      "Pechuga de pollo cocida 1 pechuga grande · Arroz integral cocido ¾ taza · Ensalada verde a gusto · Aceite de oliva o girasol 1 cucharadita"
    );
  });
});

describe("escalarPlato · tope", () => {
  it("ningún alimento pasa del doble del menú tipo: 4 galletas → máximo 8", () => {
    const mm = [a("Galletas integrales", 32, "4 galletas", 20.8, 2.9, 4.8), a("Queso light", 60, "2 tajadas", 1.2, 13.8, 6)];
    const r = escalarPlato(mm, { carboG: 60, proteinaG: 14, grasaG: 11 }, despensa, "duro");
    expect(r[0].medida_casera).toBe("8 galletas");
  });
});

describe("escalarPlato · opcionales", () => {
  it("el banano 'solo en días con entreno' sale en descanso; la piña queda", () => {
    const tarde = [a("Piña", 165, "1 taza", 21.5, 0.8, 0.2), a("Banano", 120, "1 banano", 27.6, 1.3, 0.4, "solo en días con entreno")];
    const r = escalarPlato(tarde, { carboG: 12, proteinaG: 7, grasaG: 12 }, despensa, "descanso");
    expect(r.map((x) => x.nombre)).toEqual(["Piña"]);
  });
});

describe("antes y durante", () => {
  it("25 g antes de entrenar: 1 pan de agua con un poco de miel", () => {
    const r = menuPre(25, despensa);
    expect(r[0].medida_casera).toBe("1 pan");
    expect(r[1].nombre).toBe("Miel de abeja");
  });
  it("antes de una salida larga (84 C · 23 P): 2 panes de agua con 2 tajadas de queso light, miel y banano", () => {
    const r = menuPre(84, despensa, 23);
    expect(r.map((x) => `${x.nombre} ${x.medida_casera}`)).toEqual(["Pan de agua precocido 2 panes", "Queso light 2 tajadas", "Miel de abeja 1 cucharada", "Banano 1 banano"]);
  });
  it("4 h a 60 g/h: 2 bebidas isotónicas y el resto en geles", () => {
    const r = menuDurante(240, 4, despensa);
    expect(r[0].medida_casera).toBe("2 botellas");
    expect(r[1].medida_casera).toBe("7 geles");
  });
});

describe("listaCompras", () => {
  it("una semana: pollo en crudo, panes en fundas, huevos por unidad, fruta entera y leche en litros", () => {
    const semana = Array.from({ length: 7 }, () => [...almuerzo, ...desayuno]).flat();
    const l = listaCompras(semana, despensa);
    const ver = (n: string) => l.find((x) => x.nombre.startsWith(n))!;
    expect(ver("Pechuga de pollo")).toMatchObject({ cantidad: "1,9 kg", grupo: "Proteína" }); // 1.400 g cocido × 1,33
    expect(ver("Huevo")).toMatchObject({ cantidad: "14" });
    expect(ver("Pan de agua")).toMatchObject({ cantidad: "3 fundas", detalle: "14 panes · fundas de 6" });
    expect(ver("Arroz integral")).toMatchObject({ cantidad: "550 g" }); // 1.400 g cocido / 2,5 = 560
    expect(ver("Papaya")).toMatchObject({ cantidad: "1 mediana" });
    expect(ver("Leche")).toMatchObject({ cantidad: "2,5 L" }); // 1.750 ml + 7 cafés × 60 ml
    expect(ver("Queso light")).toMatchObject({ cantidad: "200 g", detalle: "7 tajadas" });
    expect(ver("Lechuga")).toMatchObject({ cantidad: "7 comidas" });
  });
});
