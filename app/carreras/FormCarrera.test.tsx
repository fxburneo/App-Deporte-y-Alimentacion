// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FormCarrera from "./FormCarrera";

vi.mock("./actions", () => ({ guardarCarrera: vi.fn(async () => ({ error: null })) }));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

const inicial = { nombre: "", fecha: "2027-01-10", deporte: "trail" as const, distancia_km: null, desnivel_m: null, horas_min: 3, horas_max: 4, prioridad: "B" as const };

afterEach(cleanup);

describe("FormCarrera", () => {
  it("las horas estimadas cambian el tipo de carga que se muestra", () => {
    render(<FormCarrera inicial={inicial} />);
    expect(screen.getByText(/3 a 5 h: 1 día de carga/)).toBeTruthy();
    const mas = screen.getByRole("button", { name: "Más horas (máximo)" });
    for (let i = 0; i < 12; i++) fireEvent.click(mas); // 4 h → 10 h
    expect(screen.getByText(/5 a 12 h: 2 días de carga/)).toBeTruthy();
    expect((document.querySelector('input[name="horas_max"]') as HTMLInputElement).value).toBe("10");
  });

  it("el mínimo no puede pasar al máximo: lo empuja", () => {
    render(<FormCarrera inicial={inicial} />);
    const masMin = screen.getByRole("button", { name: "Más horas (mínimo)" });
    for (let i = 0; i < 4; i++) fireEvent.click(masMin); // 3 h → 5 h
    expect((document.querySelector('input[name="horas_min"]') as HTMLInputElement).value).toBe("5");
    expect((document.querySelector('input[name="horas_max"]') as HTMLInputElement).value).toBe("5");
  });

  it("carrera A explica qué cambia en la alimentación", () => {
    render(<FormCarrera inicial={inicial} />);
    fireEvent.click(screen.getByRole("button", { name: "A · objetivo" }));
    expect(screen.getByText(/sin déficit las últimas 3 semanas/)).toBeTruthy();
  });
});
