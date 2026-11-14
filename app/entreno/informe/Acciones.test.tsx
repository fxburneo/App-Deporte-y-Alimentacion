// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Compartir } from "./Acciones";

vi.mock("./actions", () => ({ generarInforme: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
afterEach(cleanup);

describe("Compartir", () => {
  it("sin hoja de compartir, copia el informe y avisa", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<Compartir texto="Semana 9 nov" />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "COMPARTIR CON EL COACH" })));
    expect(writeText).toHaveBeenCalledWith("Semana 9 nov");
    expect(screen.getByText(/Copiado/)).toBeTruthy();
  });
  it("con la hoja del iPhone, la abre con el texto", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { share });
    render(<Compartir texto="Semana 9 nov" />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "COMPARTIR CON EL COACH" })));
    expect(share).toHaveBeenCalledWith({ text: "Semana 9 nov" });
  });
});
