// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LoComi from "./LoComi";
import DetalleDia from "./DetalleDia";
import BotonMas from "../BotonMas";

const registrar = vi.fn();
const deshacer = vi.fn();
const siguiente = vi.fn();
const refresh = vi.fn();
const push = vi.fn();
vi.mock("@/app/registrar/actions", () => ({
  registrarLoDeSiempre: (...a: unknown[]) => registrar(...a),
  deshacerRegistro: (id: number) => deshacer(id),
  siguienteLoDeSiempre: () => siguiente(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push }) }));
vi.mock("next/link", () => ({ default: ({ children, href, onClick }: { children: React.ReactNode; href: string; onClick?: () => void }) => <a href={href} onClick={onClick}>{children}</a> }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("LoComi", () => {
  it("registra en un toque y se puede deshacer", async () => {
    registrar.mockResolvedValue({ ok: true, id: 42, kcal: 720 });
    render(<LoComi momento="almuerzo" nombre="Almuerzo" />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "✓ Lo comí" })));
    expect(registrar).toHaveBeenCalledWith("almuerzo", undefined);
    expect(screen.getByRole("status").textContent).toMatch(/Almuerzo registrado.*720 kcal/);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Deshacer" })));
    expect(deshacer).toHaveBeenCalledWith(42);
  });
  it("si falla, muestra el motivo", async () => {
    registrar.mockResolvedValue({ ok: false, error: "Esta comida no tiene plato de siempre: usa Comí otra cosa." });
    render(<LoComi momento="cena" nombre="Cena" />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "✓ Lo comí" })));
    expect(screen.getByRole("alert").textContent).toMatch(/no tiene plato de siempre/);
  });
});

describe("DetalleDia", () => {
  it("abre la hoja con gasto, lo comido, lo que queda y el déficit", () => {
    render(<DetalleDia n={{ tipo: "día intenso", reposo: 1680, vidaDiaria: 500, entreno: 720, objetivo: 2550, comido: 1310, proteina: { real: 96, obj: 174, porKg: "2,3 g por kilo" }, grasa: { real: 31, obj: 60, porKg: "0,8 g por kilo" }, carbo: { real: 142, obj: 310 }, pesoKg: "75,5" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Tu día en números" }));
    expect(screen.getByText("2.900 kcal")).toBeTruthy();
    expect(screen.getByText("te quedan 1.240")).toBeTruthy();
    expect(screen.getByText(/déficit: lo que dejas de comer para bajar de peso \(350 kcal hoy\)/)).toBeTruthy();
  });
});

describe("BotonMas", () => {
  it("abre el menú con lo que toca primero y lo registra en un toque", async () => {
    siguiente.mockResolvedValue({ momento: "almuerzo", texto: "Pollo 200 g · Arroz blanco 1 ½ tazas", kcal: 720 });
    registrar.mockResolvedValue({ ok: true, id: 1, kcal: 720 });
    render(<BotonMas />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Registrar" })));
    const op = screen.getByRole("button", { name: /Almuerzo · lo de siempre/ });
    expect(screen.getByRole("link", { name: /Foto/ }).getAttribute("href")).toBe("/registrar?modo=foto&comida=almuerzo");
    await act(async () => fireEvent.click(op));
    expect(registrar).toHaveBeenCalledWith("almuerzo");
    expect(push).toHaveBeenCalledWith("/");
  });
});
