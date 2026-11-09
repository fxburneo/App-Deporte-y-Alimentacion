// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FormRegistrar from "./FormRegistrar";
import type { Macros } from "@/lib/nutricion/ajuste";
import type { Comida } from "@/lib/nutricion/motor";

const analizar = vi.fn();
const guardarComida = vi.fn();
const push = vi.fn();
vi.mock("./actions", () => ({ analizar: (fd: FormData) => analizar(fd), guardarComida: (d: unknown) => guardarComida(d) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

const reparto: Record<Comida, Macros> = {
  desayuno: { carboG: 68, proteinaG: 30, grasaG: 10 },
  media_manana: { carboG: 34, proteinaG: 30, grasaG: 10 },
  almuerzo: { carboG: 57, proteinaG: 30, grasaG: 10 },
  media_tarde: { carboG: 23, proteinaG: 30, grasaG: 10 },
  cena: { carboG: 46, proteinaG: 30, grasaG: 10 },
};
const horarios = { desayuno: "06:45", media_manana: "10:00", almuerzo: "13:00", media_tarde: "16:00", cena: "19:00" };

const almuerzoIA = {
  alimentos: [
    { nombre: "Pollo a la plancha", detalle: "", gramos: 150, medida_casera: "1 pechuga mediana", carbo_g: 0, proteina_g: 46, grasa_g: 5 },
    { nombre: "Arroz blanco", detalle: "", gramos: 160, medida_casera: "1 taza", carbo_g: 45, proteina_g: 4, grasa_g: 0 },
    { nombre: "Ensalada + aguacate", detalle: "", gramos: 120, medida_casera: "½ aguacate", carbo_g: 6, proteina_g: 2, grasa_g: 11 },
    { nombre: "Jugo de mora", detalle: "", gramos: 300, medida_casera: "1 vaso", carbo_g: 30, proteina_g: 1, grasa_g: 0 },
  ],
  preguntas: [
    {
      texto: "¿El jugo tenía azúcar?",
      alimento: 3,
      opciones: [
        { etiqueta: "Sí, con azúcar", carbo_g: 30, proteina_g: 1, grasa_g: 0 },
        { etiqueta: "Sin azúcar", carbo_g: 12, proteina_g: 1, grasa_g: 0 },
      ],
    },
  ],
  nota: "",
};

function dibujar() {
  return render(
    <FormRegistrar
      inicial="almuerzo"
      horarios={horarios}
      reparto={reparto}
      consumido={{ desayuno: reparto.desayuno, media_manana: reparto.media_manana }}
      mananaExigente={false}
      temprano
      despensa={[
        { id: 9, nombre: "Galletas Amor", marca: "Nestlé", tipo: "marca", categoria: "carbo", carbo_100: 68, proteina_100: 7, grasa_100: 18, porcion_g: 28, porcion_nombre: "3 galletas (28 g)", unidad_g: 9.3, unidad_nombre: "galleta" },
      ]}
      platos={[]}
      recientes={[
        { comida: "desayuno", fecha: "2026-10-27", alimentos: [almuerzoIA.alimentos[1]], kcal: 196 },
        { comida: "almuerzo", fecha: "2026-10-28", alimentos: [almuerzoIA.alimentos[0]], kcal: 229 },
      ]}
    />
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("FormRegistrar", () => {
  it("por texto: la IA desglosa, pregunta lo que no ve y muestra el ajuste del resto del día", async () => {
    analizar.mockResolvedValue({ ok: true, analisis: almuerzoIA });
    guardarComida.mockResolvedValue({ ok: true });
    dibujar();
    fireEvent.click(screen.getByRole("tab", { name: /Escribir/ }));
    fireEvent.change(screen.getByLabelText("Qué comiste"), { target: { value: "pollo con arroz, ensalada y jugo de mora" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "CALCULAR CON IA" })));

    expect(screen.getByText("Pollo a la plancha")).toBeTruthy();
    expect(screen.getByText("? C")).toBeTruthy();
    // Sin responder no se puede guardar
    expect((screen.getByRole("button", { name: /Responde la pregunta/ }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Sí, con azúcar" }));
    expect(screen.getByText(/Te pasaste 242 kcal: así se ajusta el resto del día/i)).toBeTruthy();
    expect(screen.getByText(/Media tarde 16:00/)).toBeTruthy();

    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Guardar Almuerzo/i })));
    expect(guardarComida).toHaveBeenCalledWith(expect.objectContaining({ comida: "almuerzo", origen: "texto" }));
    expect(push).toHaveBeenCalledWith("/comidas");
  });

  it("si contesta 'sin azúcar' el jugo baja a 12 g de carbohidrato", async () => {
    analizar.mockResolvedValue({ ok: true, analisis: almuerzoIA });
    dibujar();
    fireEvent.click(screen.getByRole("tab", { name: /Escribir/ }));
    fireEvent.change(screen.getByLabelText("Qué comiste"), { target: { value: "almuerzo" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "CALCULAR CON IA" })));
    fireEvent.click(screen.getByRole("button", { name: "Sin azúcar" }));
    expect(screen.getByText("12 C")).toBeTruthy();
  });

  it("muestra el error de la IA sin perder lo escrito", async () => {
    analizar.mockResolvedValue({ ok: false, error: "Falta conectar la IA: la llave de Anthropic todavía no está en Vercel." });
    dibujar();
    fireEvent.click(screen.getByRole("tab", { name: /Escribir/ }));
    fireEvent.change(screen.getByLabelText("Qué comiste"), { target: { value: "2 huevos" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "CALCULAR CON IA" })));
    expect(screen.getByText(/Falta conectar la IA/)).toBeTruthy();
    expect((screen.getByLabelText("Qué comiste") as HTMLTextAreaElement).value).toBe("2 huevos");
  });

  it("repetir muestra solo la comida elegida y la carga sin llamar a la IA", () => {
    dibujar();
    fireEvent.click(screen.getByRole("tab", { name: /Mis comidas/ }));
    // Almuerzo elegido: aparece el almuerzo anterior, no el desayuno
    expect(screen.queryByRole("button", { name: /Arroz blanco/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Pollo a la plancha/ }));
    expect(analizar).not.toHaveBeenCalled();
    expect(screen.getByText("Lo que vas a registrar")).toBeTruthy();
  });

  it("al cambiar a Desayuno, Repetir muestra los desayunos", () => {
    dibujar();
    fireEvent.click(screen.getByRole("tab", { name: /Mis comidas/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Desayuno/ }));
    expect(screen.getByRole("button", { name: /Arroz blanco/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Pollo a la plancha/ })).toBeNull();
  });

  it("dentro de Mis comidas se puede agregar algo distinto con la IA", async () => {
    analizar.mockResolvedValue({
      ok: true,
      analisis: { alimentos: [{ nombre: "Banano", detalle: "", gramos: 120, medida_casera: "1 mediano", carbo_g: 27, proteina_g: 1, grasa_g: 0 }], preguntas: [], nota: "" },
    });
    dibujar();
    fireEvent.click(screen.getByRole("tab", { name: /Mis comidas/ }));
    fireEvent.click(screen.getByRole("button", { name: /Pollo a la plancha/ }));
    fireEvent.change(screen.getByLabelText("Agregar algo distinto"), { target: { value: "1 banano" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Agregar" })));
    expect(screen.getAllByText("Pollo a la plancha").length).toBeGreaterThan(0);
    expect(screen.getByText("Banano")).toBeTruthy();
  });

  it("corregir los gramos escala los macros", async () => {
    analizar.mockResolvedValue({ ok: true, analisis: { ...almuerzoIA, preguntas: [] } });
    dibujar();
    fireEvent.click(screen.getByRole("tab", { name: /Escribir/ }));
    fireEvent.change(screen.getByLabelText("Qué comiste"), { target: { value: "almuerzo" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "CALCULAR CON IA" })));
    fireEvent.click(screen.getByText("Arroz blanco"));
    const g = screen.getByLabelText("Gramos");
    fireEvent.change(g, { target: { value: "80" } });
    fireEvent.blur(g);
    expect(screen.getByText(/80 g · 1 taza/)).toBeTruthy();
    expect(screen.getByText("23 C")).toBeTruthy(); // 45 g × 80/160 = 22,5
  });

  it("Mis comidas: busca en la despensa, agrega por unidades sin IA y se puede cambiar la cantidad", () => {
    dibujar();
    fireEvent.click(screen.getByRole("tab", { name: /Mis comidas/ }));
    fireEvent.change(screen.getByLabelText("Buscar en mis comidas"), { target: { value: "gall" } });
    fireEvent.click(screen.getByRole("button", { name: /Galletas Amor/ }));
    expect(analizar).not.toHaveBeenCalled();
    expect(screen.getByText("3 galletas")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Más Galletas Amor" }));
    expect(screen.getByText("4 galletas")).toBeTruthy();
  });

  it("Antes de entrenar aparece aunque el plan no haya sugerido snack (el entreno llega de Garmin después)", async () => {
    analizar.mockResolvedValue({
      ok: true,
      analisis: { alimentos: [{ nombre: "Jugo de manzana", detalle: "", gramos: 200, medida_casera: "1 vaso", carbo_g: 17, proteina_g: 0, grasa_g: 0 }], preguntas: [], nota: "" },
    });
    guardarComida.mockResolvedValue({ ok: true });
    dibujar(); // sin objetivoPre
    fireEvent.click(screen.getByRole("button", { name: /^Antes de entrenar/ }));
    fireEvent.click(screen.getByRole("tab", { name: /Escribir/ }));
    fireEvent.change(screen.getByLabelText("Qué comiste"), { target: { value: "jugo de manzana" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "CALCULAR CON IA" })));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Guardar Antes de entrenar/i })));
    expect(guardarComida).toHaveBeenCalledWith(expect.objectContaining({ comida: "pre_entreno" }));
  });

  it("Extra: no tiene objetivo propio y se compensa en el resto del día", async () => {
    analizar.mockResolvedValue({
      ok: true,
      analisis: { alimentos: [{ nombre: "Chocolate", detalle: "", gramos: 50, medida_casera: "1 barra", carbo_g: 28, proteina_g: 3, grasa_g: 15 }], preguntas: [], nota: "" },
    });
    dibujar();
    fireEvent.click(screen.getByRole("button", { name: /^Extra/ }));
    fireEvent.click(screen.getByRole("tab", { name: /Escribir/ }));
    fireEvent.change(screen.getByLabelText("Qué comiste"), { target: { value: "un chocolate" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "CALCULAR CON IA" })));
    expect(screen.getByText("Extra fuera de horario")).toBeTruthy();
    expect(screen.getByText(/así se ajusta el resto del día/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Guardar Extra/i })).toBeTruthy();
  });
});

describe("FormRegistrar · durante el entreno", () => {
  it("con entreno largo muestra el objetivo de carbohidrato y guarda como 'durante'", async () => {
    analizar.mockResolvedValue({
      ok: true,
      analisis: { alimentos: [{ nombre: "Gel", detalle: "", gramos: 96, medida_casera: "3 geles", carbo_g: 75, proteina_g: 0, grasa_g: 0 }], preguntas: [], nota: "" },
    });
    guardarComida.mockResolvedValue({ ok: true });
    render(
      <FormRegistrar inicial="durante" horarios={horarios} reparto={reparto} consumido={{}} mananaExigente={false} temprano despensa={[]} platos={[]} recientes={[]} objetivoDurante={{ carboG: 240, proteinaG: 0, grasaG: 0 }} />
    );
    fireEvent.click(screen.getByRole("tab", { name: /Escribir/ }));
    fireEvent.change(screen.getByLabelText("Qué comiste"), { target: { value: "3 geles" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "CALCULAR CON IA" })));
    expect(screen.getByText(/Durante el entreno contra el objetivo/i)).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Guardar Durante el entreno/i })));
    expect(guardarComida).toHaveBeenCalledWith(expect.objectContaining({ comida: "durante" }));
  });

  it("sin entreno largo cargado avisa que no mueve las comidas", async () => {
    analizar.mockResolvedValue({
      ok: true,
      analisis: { alimentos: [{ nombre: "Gel", detalle: "", gramos: 32, medida_casera: "1 gel", carbo_g: 25, proteina_g: 0, grasa_g: 0 }], preguntas: [], nota: "" },
    });
    render(<FormRegistrar inicial="durante" horarios={horarios} reparto={reparto} consumido={{}} mananaExigente={false} temprano={false} despensa={[]} platos={[]} recientes={[]} />);
    fireEvent.click(screen.getByRole("tab", { name: /Escribir/ }));
    fireEvent.change(screen.getByLabelText("Qué comiste"), { target: { value: "1 gel" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "CALCULAR CON IA" })));
    expect(screen.getByText(/se guarda sin mover las comidas/)).toBeTruthy();
  });
});

describe("FormRegistrar · día anterior", () => {
  it("muestra la fecha, guarda con esa fecha y vuelve a las comidas de ese día", async () => {
    analizar.mockResolvedValue({
      ok: true,
      analisis: { alimentos: [{ nombre: "Yogurt natural", detalle: "", gramos: 200, medida_casera: "1 taza", carbo_g: 9, proteina_g: 7, grasa_g: 7 }], preguntas: [], nota: "" },
    });
    guardarComida.mockResolvedValue({ ok: true });
    render(
      <FormRegistrar inicial="cena" horarios={horarios} reparto={reparto} consumido={{}} mananaExigente={false} temprano={false} despensa={[]} platos={[]} recientes={[]} fecha="2026-11-08" fechaTexto="Domingo 8 nov" />
    );
    expect(screen.getByText("Domingo 8 nov")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: /Escribir/ }));
    fireEvent.change(screen.getByLabelText("Qué comiste"), { target: { value: "yogur" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "CALCULAR CON IA" })));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Guardar Cena/i })));
    expect(guardarComida).toHaveBeenCalledWith(expect.objectContaining({ comida: "cena", fecha: "2026-11-08" }));
    expect(push).toHaveBeenCalledWith("/comidas?fecha=2026-11-08");
  });
});
