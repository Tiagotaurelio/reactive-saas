// @vitest-environment jsdom

import React from "react";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

const useReactiveSnapshotMock = vi.fn();

vi.mock("../lib/use-reactive-snapshot", () => ({
  useReactiveSnapshot: () => useReactiveSnapshotMock()
}));

import DashboardPage from "../app/dashboard/page";
import ClientesPage from "../app/clientes/page";
import InboxPage from "../app/inbox/page";
import { createSeedState, deriveSnapshot } from "../lib/reactive-domain";

describe("ReActive operational pages", () => {
  const baseSnapshot = deriveSnapshot(createSeedState());

  beforeEach(() => {
    useReactiveSnapshotMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders dashboard loading and latest import feedback", () => {
    useReactiveSnapshotMock.mockReturnValue({
      snapshot: baseSnapshot,
      isLoading: true,
      error: null
    });

    render(<DashboardPage />);

    expect(screen.getByText("Atualizando painel")).toBeTruthy();
    expect(screen.getByText("Ultima importacao processada")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Importar novo CSV" }).getAttribute("href")).toBe("/importar-csv");
  });

  it("renders dashboard error state while preserving seeded stats", () => {
    useReactiveSnapshotMock.mockReturnValue({
      snapshot: baseSnapshot,
      isLoading: false,
      error: "Nao foi possivel carregar o snapshot operacional agora."
    });

    render(<DashboardPage />);

    expect(screen.getByText("Falha ao carregar dashboard")).toBeTruthy();
    expect(screen.getByText("Nao foi possivel carregar o snapshot operacional agora.")).toBeTruthy();
    expect(screen.getByText("Receita em Risco")).toBeTruthy();
  });

  it("renders clientes empty state when there are no consolidated customers", () => {
    useReactiveSnapshotMock.mockReturnValue({
      snapshot: {
        ...baseSnapshot,
        customers: []
      },
      isLoading: false,
      error: null
    });

    render(<ClientesPage />);

    expect(screen.getByText("Nenhum cliente consolidado ainda. Importe um CSV para gerar score, status e fila de prioridade.")).toBeTruthy();
  });

  it("renders clientes loading and customer priority cards", () => {
    useReactiveSnapshotMock.mockReturnValue({
      snapshot: baseSnapshot,
      isLoading: true,
      error: null
    });

    render(<ClientesPage />);

    expect(screen.getByText("Atualizando clientes")).toBeTruthy();
    expect(screen.getByText("Mercantil Costa Norte")).toBeTruthy();
    expect(screen.getAllByText(/Ver detalhe/i)[0]?.getAttribute("href")).toBe("/clientes/C-100");
  });

  it("renders inbox error and completed handoff states", () => {
    useReactiveSnapshotMock.mockReturnValue({
      snapshot: {
        ...baseSnapshot,
        inboxThreads: [
          {
            customerId: "C-500",
            customer: "Cliente Handoff",
            seller: "Paula Melo",
            status: "Atencao",
            waiting: false,
            lastInbound: "",
            lastOutbound: "Retorno alinhado com o vendedor.",
            messages: []
          }
        ]
      },
      isLoading: false,
      error: "Falha temporaria ao carregar inbox."
    });

    render(<InboxPage />);

    expect(screen.getByText("Falha ao carregar inbox")).toBeTruthy();
    expect(screen.getByText("Falha temporaria ao carregar inbox.")).toBeTruthy();
    expect(screen.getByText("handoff concluido")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Abrir thread" }).getAttribute("href")).toBe("/inbox/C-500");
  });

  it("renders inbox empty state when there are no threads", () => {
    useReactiveSnapshotMock.mockReturnValue({
      snapshot: {
        ...baseSnapshot,
        inboxThreads: []
      },
      isLoading: false,
      error: null
    });

    render(<InboxPage />);

    expect(screen.getByText("Nenhuma thread aguardando acao no momento.")).toBeTruthy();
  });
});
