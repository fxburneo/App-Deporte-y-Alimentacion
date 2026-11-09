// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import EditarRegistro from "./EditarRegistro";

const analizar = vi.fn();
const editarComida = vi.fn();
const borrarComida = vi.fn();
const push = vi.fn();
vi.mock("../../../registrar/actions", () => ({
  analizar: (fd: FormData) => analizar(fd),
  editarComida: (...a: unknown[]) => editarComida(...a),
  borrarComida: (fd: FormData) => borrarComida(fd),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

const almuerzo = [
  { nombre: "Pulled pork", detalle: "", gramos: 150, medida_casera: "1 porción", carbo_g: 15, proteina_g: 33, grasa_g: 15 },
  { nombre: "Cerveza", detalle: "", gramos: 710, medida_casera: "2 latas", carbo_g: 26, proteina_g: 3, grasa_g: 0 },
];
const pan = { id: 20, nombre: "Pan de agua precocido", marca: "Supermaxi", tipo: "marca", categoria: "carbo", carbo_100: 51.4, proteina_100: 8.6, grasa_100: 5.7, porcion_g: 35, porcion_nombre: "1 pan (35 g)", unidad_g: 35, unidad_nombre: "pan" } as const;

const dibujar = () =>
  render(<EditarRegistro id={7} comida="media_manana" alimentosIniciales={almuerzo} volver="/comidas?fecha=2026-11-08" fechaTexto="Domingo 8 nov" despensa={[pan]} />);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("EditarRegistro", () => {
  it("mueve el registro a otra comida y guarda con la comida nueva", async () => {
    editarComida.mockResolvedValue({ ok: true });
    dibujar();
    expect(screen.getByText("Domingo 8 nov")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Desayuno" }));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "GUARDAR CAMBIOS" })));
    expect(editarComida).toHaveBeenCalledWith(7, almuerzo, "desayuno");
    expect(push).toHaveBeenCalledWith("/comidas?fecha=2026-11-08");
  });

  it("− y + cambian la cantidad y escalan los macros", () => {
    dibujar();
    fireEvent.click(screen.getByRole("button", { name: "Más Pulled pork" })); // 150 g + 40 g (un cuarto, redondeado a 5)
    expect(screen.getByText("190 g")).toBeTruthy();
    expect(screen.getByText("42 P")).toBeTruthy(); // 33 × 190/150 = 41,8
  });

  it("agrega con la IA solo lo nuevo y desde la despensa por unidad", async () => {
    analizar.mockResolvedValue({
      ok: true,
      analisis: { alimentos: [{ nombre: "Pan de hamburguesa", detalle: "", gramos: 60, medida_casera: "1 pan", carbo_g: 26, proteina_g: 5, grasa_g: 3 }], preguntas: [], nota: "" },
    });
    dibujar();
    fireEvent.change(screen.getByLabelText("Qué agregar"), { target: { value: "1 pan de hamburguesa" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Agregar" })));
    expect(screen.getByText("Pan de hamburguesa")).toBeTruthy();
    expect(screen.getByText("Pulled pork")).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "Mi despensa" }));
    fireEvent.change(screen.getByLabelText("Buscar en mi despensa"), { target: { value: "pan de agua" } });
    fireEvent.click(screen.getByRole("button", { name: /Pan de agua precocido/ }));
    expect(screen.getByText("1 pan")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Más Pan de agua precocido" }));
    expect(screen.getByText("2 panes")).toBeTruthy();
  });

  it("quitar un alimento y borrar el registro", async () => {
    borrarComida.mockResolvedValue(undefined);
    dibujar();
    fireEvent.click(screen.getByRole("button", { name: "Quitar Cerveza" }));
    expect(screen.queryByText("Cerveza")).toBeNull();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Borrar este registro" })));
    expect(borrarComida).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/comidas?fecha=2026-11-08");
  });
});
