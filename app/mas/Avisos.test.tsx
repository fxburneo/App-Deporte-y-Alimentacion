// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Avisos from "./Avisos";
import { claveABytes } from "@/lib/avisos/claves";

const cambiarAviso = vi.fn();
vi.mock("./avisos-actions", () => ({
  cambiarAviso: (c: string, a: boolean) => cambiarAviso(c, a),
  enviarPrueba: vi.fn(),
  guardarSuscripcion: vi.fn(),
  quitarSuscripcion: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Avisos", () => {
  it("lista los 7 avisos de la maqueta y apagar uno lo guarda", async () => {
    render(<Avisos preferencias={{ dormir: false }} clavePublica="x" />);
    expect(screen.getAllByRole("switch")).toHaveLength(7);
    expect(screen.getByRole("switch", { name: "Hora de dormir" }).getAttribute("aria-checked")).toBe("false");
    await act(async () => fireEvent.click(screen.getByRole("switch", { name: "Peso (L · M · V)" })));
    expect(cambiarAviso).toHaveBeenCalledWith("peso", false);
  });

  it("en un navegador sin avisos (Safari sin instalar) explica qué hacer", async () => {
    await act(async () => {
      render(<Avisos preferencias={{}} clavePublica="x" />);
    });
    expect(screen.queryByRole("button", { name: /ACTIVAR AVISOS/ })).toBeNull();
    expect(screen.getByText(/no permite avisos|pantalla de inicio/)).toBeTruthy();
  });
});

describe("claveABytes", () => {
  it("convierte la clave pública base64url a bytes", () => {
    expect(Array.from(claveABytes("AQID_-8"))).toEqual([1, 2, 3, 255, 239]);
  });
});
