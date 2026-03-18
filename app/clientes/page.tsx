"use client";

import Link from "next/link";

import { OperationFeedback } from "@/components/operation-feedback";
import { PageHeader } from "@/components/page-header";
import { useReactiveSnapshot } from "@/lib/use-reactive-snapshot";

export default function ClientesPage() {
  const { snapshot, isLoading, error } = useReactiveSnapshot();

  return (
    <div>
      <PageHeader
        eyebrow="Clientes"
        title="Fila de prioridade por risco e potencial"
        description="A lista de clientes deve priorizar quem esta logo apos a janela ideal de recompra, com bom historico de valor e frequencia consistente."
      />

      {isLoading ? (
        <div className="mb-6">
          <OperationFeedback tone="info" title="Atualizando clientes" message="Carregando score, risco e historico consolidado da base atual." />
        </div>
      ) : null}

      {error ? (
        <div className="mb-6">
          <OperationFeedback tone="error" title="Falha ao carregar clientes" message={error} />
        </div>
      ) : null}

      <section className="rounded-[32px] bg-white p-6 shadow-panel">
        <div className="mb-5 flex flex-wrap gap-3">
          {["Status", "Score", "Vendedor", "Recencia", "Valor", "Com resposta"].map((filter) => (
            <div key={filter} className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
              {filter}
            </div>
          ))}
        </div>

        <div className="grid gap-4">
          {snapshot.customers.map((customer) => (
            <article key={customer.name} className="rounded-[28px] border border-slate-100 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{customer.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{customer.seller}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={statusClasses(customer.status)}>
                    {customer.status}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    Score {customer.priorityScore}
                  </span>
                  {customer.canRegisterFirstDispatch ? (
                    <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-semibold text-brand-blue">
                      Elegivel para disparo automatico
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-slate-500 md:grid-cols-3">
                <p>Janela ultrapassada: {customer.lagLabel}</p>
                <p>Dias desde ultima compra: {customer.daysSinceLastPurchase}</p>
                <p>Valor ultimas 3 compras: {formatCurrency(customer.last3OrdersValue)}</p>
              </div>
              <div className="mt-4 grid gap-3 rounded-[24px] bg-brand-surface p-4 text-sm text-slate-600 md:grid-cols-3">
                <p>
                  1o disparo:{" "}
                  {customer.firstAutoDispatchAt ? formatDateTime(customer.firstAutoDispatchAt) : "nao registrado"}
                </p>
                <p>Receita recuperada: {formatCurrency(customer.recoveredRevenue)}</p>
                <p>Pedidos atribuidos: {customer.recoveredOrdersCount}</p>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-[24px] border border-slate-100 p-4">
                <div>
                  <p className="text-sm font-medium text-brand-ink">Historico detalhado</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Abra o perfil para auditar compra, disparo automatico e pedidos atribuidos.
                  </p>
                </div>
                <Link
                  className="rounded-full bg-brand-blue px-4 py-2 text-sm font-medium text-white"
                  href={`/clientes/${customer.customerId}`}
                >
                  Ver detalhe
                </Link>
              </div>
            </article>
          ))}
          {snapshot.customers.length === 0 ? (
            <article className="rounded-[28px] border border-dashed border-slate-200 p-5 text-sm text-slate-500">
              Nenhum cliente consolidado ainda. Importe um CSV para gerar score, status e fila de prioridade.
            </article>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function statusClasses(status: string): string {
  if (status === "Atencao") {
    return "rounded-full bg-brand-attention/10 px-3 py-1 text-xs font-semibold text-brand-attention";
  }

  if (status === "Em risco") {
    return "rounded-full bg-brand-danger/10 px-3 py-1 text-xs font-semibold text-brand-danger";
  }

  if (status === "Inativo") {
    return "rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600";
  }

  return "rounded-full bg-brand-success/10 px-3 py-1 text-xs font-semibold text-brand-success";
}
