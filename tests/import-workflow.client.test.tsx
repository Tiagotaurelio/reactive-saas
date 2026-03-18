// @vitest-environment jsdom

import React from "react";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const refreshSpy = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshSpy
  })
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

import { ImportWorkflow } from "../components/import-workflow";

describe("ImportWorkflow", () => {
  const originalFetch = global.fetch;
  const originalConfirm = window.confirm;
  const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

  beforeEach(() => {
    refreshSpy.mockReset();
    dispatchEventSpy.mockClear();
    window.confirm = vi.fn(() => true);
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanup();
    window.confirm = originalConfirm;
    global.fetch = originalFetch;
  });

  it("shows an error when the selected file is not a CSV", async () => {
    render(<ImportWorkflow />);

    const input = getFileInput();
    const invalidFile = new File(["hello"], "clientes.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [invalidFile] } });

    expect(await screen.findByText("Falha na importacao")).toBeTruthy();
    expect(screen.getByText("Envie um arquivo CSV valido para continuar.")).toBeTruthy();
  });

  it("cancels processing when there are rejected rows and confirmation is denied", async () => {
    window.confirm = vi.fn(() => false);
    render(<ImportWorkflow />);

    await uploadCsv([
      "cliente_id,nome,telefone,vendedor_responsavel,data_compra,valor_compra,pedido_id",
      "C-200,Armazem Teste,11999990100,Ana Torres,2026-03-01,4270.50,P-2001",
      "C-201,Loja Sem Telefone,,Marcos Prado,2026-02-07,2750.30,P-2002"
    ].join("\n"));

    expect(await screen.findByText("Revise antes de importar")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Processar importacao" }));

    expect(await screen.findByText("Importacao com ressalvas")).toBeTruthy();
    expect(screen.getByText("Processamento cancelado. Revise as linhas rejeitadas antes de importar.")).toBeTruthy();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows a server error when the import request fails", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "boom" }), { status: 500, headers: { "Content-Type": "application/json" } })
    );

    render(<ImportWorkflow />);
    await uploadCsv([
      "cliente_id,nome,telefone,vendedor_responsavel,data_compra,valor_compra,pedido_id",
      "C-200,Armazem Teste,11999990100,Ana Torres,2026-03-01,4270.50,P-2001"
    ].join("\n"));

    fireEvent.click(screen.getByRole("button", { name: "Processar importacao" }));

    expect(await screen.findByText("Falha na importacao")).toBeTruthy();
    expect(screen.getByText("Falha ao persistir a importacao no servidor.")).toBeTruthy();
  });

  it("shows success feedback and impact details after a successful import", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          job: {
            importedOrders: 2,
            createdCustomers: 1,
            updatedCustomers: 1,
            invalidRows: 0,
            automaticFirstDispatches: 1
          },
          impact: {
            duplicateOrders: 1,
            impactedCustomers: [
              {
                customerId: "C-200",
                name: "Armazem Teste",
                seller: "Ana Torres",
                status: "Atencao",
                priorityScore: 77,
                recoveredRevenue: 0
              }
            ]
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    render(<ImportWorkflow />);
    await uploadCsv([
      "cliente_id,nome,telefone,vendedor_responsavel,data_compra,valor_compra,pedido_id",
      "C-200,Armazem Teste,11999990100,Ana Torres,2026-03-01,4270.50,P-2001",
      "C-200,Armazem Teste,11999990100,Ana Torres,2026-01-25,3890.00,P-1998"
    ].join("\n"));

    fireEvent.click(screen.getByRole("button", { name: "Processar importacao" }));

    expect(await screen.findByText("Importacao concluida")).toBeTruthy();
    expect(screen.getByText(/2 pedidos novos, 1 clientes criados, 1 clientes atualizados/i)).toBeTruthy();
    expect(screen.getByText("Impacto operacional imediato")).toBeTruthy();
    expect(screen.getByText("Pedidos duplicados ignorados")).toBeTruthy();
    expect(screen.getByText("Armazem Teste")).toBeTruthy();

    await waitFor(() => {
      expect(refreshSpy).toHaveBeenCalledTimes(1);
      expect(dispatchEventSpy).toHaveBeenCalled();
    });
  });
});

function getFileInput() {
  return document.querySelector('input[type="file"]') as HTMLInputElement;
}

async function uploadCsv(content: string) {
  const input = getFileInput();
  const file = new File([content], "reactive-test.csv", { type: "text/csv" }) as File & {
    text: () => Promise<string>;
  };
  file.text = vi.fn(async () => content);
  fireEvent.change(input, { target: { files: [file] } });

  await screen.findByText("reactive-test.csv");
}
