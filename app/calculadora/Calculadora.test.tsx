// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Calculadora from "./Calculadora";
import type { AlimentoDespensa } from "@/lib/despensa/calculos";

vi.mock("../registrar/actions", () => ({ guardarComida: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

const base = { marca: null, tipo: "generico" as const, unidad_g: null, unidad_nombre: null };
const despensa: AlimentoDespensa[] = [
  { ...base, id: 1, nombre: "Pechuga de pollo cocida", categoria: "proteina", carbo_100: 0, proteina_100: 31, grasa_100: 3.6, porcion_g: 150, porcion_nombre: "1 pechuga", unidad_g: 150, unidad_nombre: "pechuga" },
  { ...base, id: 2, nombre: "Arroz blanco cocido", categoria: "carbo", carbo_100: 28, proteina_100: 2.7, grasa_100: 0.3, porcion_g: 160, porcion_nombre: "1 taza", unidad_g: 160, unidad_nombre: "taza" },
];
const m = { carboG: 57, proteinaG: 30, grasaG: 10 };
const objetivos = { desayuno: m, media_manana: m, almuerzo: m, media_tarde: m, cena: m };

afterEach(cleanup);

describe("Calculadora", () => {
  it("al agregar pollo y arroz muestra los gramos de cada uno", () => {
    render(<Calculadora objetivos={objetivos} despensa={despensa} inicial="almuerzo" />);
    const buscar = screen.getByLabelText("¿Qué hay en el plato?");
    fireEvent.change(buscar, { target: { value: "pollo" } });
    fireEvent.click(screen.getByRole("button", { name: /Pechuga de pollo/ }));
    fireEvent.change(buscar, { target: { value: "arroz" } });
    fireEvent.click(screen.getByRole("button", { name: /Arroz blanco/ }));
    expect(screen.getByText(/cubre la proteína/)).toBeTruthy();
    expect(screen.getByText(/^(19|20|21)\d g$/)).toBeTruthy(); // arroz ~200 g
    expect(screen.getByRole("button", { name: "LO COMÍ: REGISTRAR" })).toBeTruthy();
  });
});
