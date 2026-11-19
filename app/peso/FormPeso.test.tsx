// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FormPeso from "./FormPeso";

vi.mock("./actions", () => ({ guardarPeso: vi.fn(async () => ({ error: null, ok: true })) }));
afterEach(cleanup);
const valor = () => (document.querySelector('input[name="kg"]') as HTMLInputElement).value;

describe("Pesarme", () => {
  it("empieza en el último peso y ajusta de a 100 g", () => {
    render(<FormPeso inicial={75.3} yaGuardado={false} />);
    expect(valor()).toBe("75.3");
    fireEvent.click(screen.getByRole("button", { name: "Menos 100 gramos" }));
    fireEvent.click(screen.getByRole("button", { name: "Menos 100 gramos" }));
    expect(valor()).toBe("75.1");
    fireEvent.click(screen.getByRole("button", { name: "Más 100 gramos" }));
    expect(valor()).toBe("75.2");
  });
  it("tocando el número se escribe el peso con coma; un valor absurdo se ignora", () => {
    render(<FormPeso inicial={75.3} yaGuardado={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Escribir el peso" }));
    const campo = screen.getByLabelText("Peso en kilos");
    fireEvent.change(campo, { target: { value: "74,8" } });
    fireEvent.blur(campo);
    expect(valor()).toBe("74.8");
    fireEvent.click(screen.getByRole("button", { name: "Escribir el peso" }));
    fireEvent.change(screen.getByLabelText("Peso en kilos"), { target: { value: "7" } });
    fireEvent.blur(screen.getByLabelText("Peso en kilos"));
    expect(valor()).toBe("74.8");
  });
  it("avisa si el peso de hoy ya estaba guardado", () => {
    render(<FormPeso inicial={75.3} yaGuardado />);
    expect(screen.getByText(/se reemplaza/)).toBeTruthy();
  });
});
