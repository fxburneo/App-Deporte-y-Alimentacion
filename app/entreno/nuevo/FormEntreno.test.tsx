// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FormEntreno from "./FormEntreno";

vi.mock("../actions", () => ({ guardarEntreno: vi.fn() }));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

const perfil = { estaturaCm: 181, edad: 42, ritmo: "moderado" as const, factorActividad: 1.35, pausa: false, horaDesayuno: "06:45" };

function dibujar() {
  return render(
    <FormEntreno
      perfil={perfil}
      pesoKg={75.4}
      existentes={{ hoy: [], manana: [] }}
      siguientes={{ hoy: [], manana: [] }}
      horaHabitual={{ hoy: "05:00", manana: "05:00" }}
      diaInicial="manana"
      estadoInicial="planificado"
    />
  );
}

afterEach(cleanup);

describe("FormEntreno", () => {
  it("por defecto (rodillo moderado 1:15 a las 05:00) muestra el día moderado de 2.630 kcal", () => {
    dibujar();
    expect(screen.getByText("2.630")).toBeTruthy();
    expect(screen.getByText("Día moderado")).toBeTruthy();
    expect(screen.getByText(/snack de 25 g/)).toBeTruthy();
  });

  it("al elegir 'Fuerte' el día pasa a duro y suben las calorías", () => {
    dibujar();
    fireEvent.click(screen.getByRole("button", { name: /Fuerte/ }));
    expect(screen.getByText("Día duro")).toBeTruthy();
    expect(screen.queryByText("2.630")).toBeNull();
  });

  it("'Lo que hice' no se puede elegir para mañana", () => {
    dibujar();
    expect((screen.getByRole("tab", { name: "Lo que hice" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Hoy" }));
    expect((screen.getByRole("tab", { name: "Lo que hice" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("descanso oculta duración e intensidad", () => {
    dibujar();
    fireEvent.click(screen.getByRole("button", { name: /Descanso/ }));
    expect(screen.queryByText("Duración")).toBeNull();
    expect(screen.getByText("Día de descanso")).toBeTruthy();
  });
});
