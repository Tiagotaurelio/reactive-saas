"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";

import { OperationFeedback } from "@/components/operation-feedback";
import { PageHeader } from "@/components/page-header";
import { useReactiveSnapshot } from "@/lib/use-reactive-snapshot";

export default function ClienteDetailPage() {
  const params = useParams<{ customerId: string }>();
  const { snapshot, isLoading, error } = useReactiveSnapshot();
  const customer = snapshot.customers.find((entry) => entry.customerId === params.customerId);
  const thread = snapshot.inboxThreads.find((entry) => entry.customerId === params.customerId);

  if (isLoading) {
    return (
      <div>
        <div className="mb-6">
          <Link className="text-sm font-medium text-brand-blue" href="/clientes">
            Voltar para clientes
          </Link>
        </div>
        <OperationFeedback tone="info" title="Atualizando perfil" message="Carregando timeline, disparo automatico e atribuicao deste cliente." />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="mb-6">
          <Link className="text-sm font-medium text-brand-blue" href="/clientes">
            Voltar para clientes
          </Link>
        </div>
        <OperationFeedback tone="error" title="Falha ao carregar perfil" message={error} />
      </div>
    );
  }

  if (!customer) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <Link className="text-sm font-medium text-brand-blue" href="/clientes">
          Voltar para clientes
        </Link>
      </div>

      <PageHeader
        eyebrow="Perfil do cliente"
        title={customer.name}
        description="Auditoria operacional do relacionamento: compra mais recente, primeiro disparo automatico e pedidos atribuidos depois do marco imutavel."
      />

      <div className="mb-6">
        <OperationFeedback
          tone={customer.firstAutoDispatchAt ? "success" : "info"}
          title={customer.firstAutoDispatchAt ? "Atribuicao financeira ativa" : "Atribuicao ainda nao iniciada"}
          message={
            customer.firstAutoDispatchAt
              ? "A partir deste marco, novos pedidos podem entrar como receita recuperada. Antes disso, a compra conta como historico normal."
              : "Enquanto o primeiro disparo automatico nao for registrado, qualquer nova compra deste cliente nao entra como receita recuperada."
          }
        />
      </div>

      <section className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <article className="rounded-[32px] bg-white p-6 shadow-panel">
          <div className="flex flex-wrap items-center gap-3">
            <span className={statusClasses(customer.status)}>{customer.status}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              Score {customer.priorityScore}
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <MetricCard label="Vendedor" value={customer.seller} />
            <MetricCard label="Dias desde ultima compra" value={String(customer.daysSinceLastPurchase)} />
            <MetricCard label="Janela de recompra" value={`${customer.repurchaseWindowDays} dias`} />
            <MetricCard label="Valor ultimas 3 compras" value={formatCurrency(customer.last3OrdersValue)} />
            <MetricCard
              label="Primeiro disparo automatico"
              value={customer.firstAutoDispatchAt ? formatDateTime(customer.firstAutoDispatchAt) : "Nao registrado"}
            />
            <MetricCard label="Receita recuperada" value={formatCurrency(customer.recoveredRevenue)} />
            <MetricCard
              label="Estado de handoff"
              value={thread ? (thread.waiting ? "Aguardando acao" : "Concluido") : "Sem thread ativa"}
            />
          </div>

          <div className="mt-6 rounded-[24px] bg-brand-surface p-4">
            <p className="text-sm font-medium text-brand-ink">Proxima acao sugerida</p>
            <p className="mt-2 text-sm text-slate-600">
              {thread
                ? thread.waiting
                  ? "Existe resposta aguardando acao comercial. Abra a thread para concluir o handoff sem perder o contexto."
                  : "A thread mais recente ja foi tratada. O proximo foco aqui e acompanhar nova compra ou novo reply."
                : "Ainda nao existe thread operacional para este cliente. A prioridade agora e registrar o primeiro disparo quando ele entrar em Atencao."}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {thread ? (
                <Link
                  className="rounded-full bg-brand-blue px-4 py-2 text-sm font-medium text-white"
                  href={`/inbox/${customer.customerId}`}
                >
                  Abrir thread
                </Link>
              ) : null}
              <Link
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700"
                href="/clientes"
              >
                Voltar para fila
              </Link>
            </div>
          </div>
        </article>

        <article className="rounded-[32px] bg-white p-6 shadow-panel">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm text-slate-500">Timeline operacional</p>
              <h3 className="mt-1 text-2xl font-semibold">Compra, disparo e atribuicao</h3>
            </div>
            <p className="text-sm text-slate-500">
              Pedidos atribuidos: <span className="font-medium text-brand-ink">{customer.recoveredOrdersCount}</span>
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {customer.timeline.map((event) => (
              <div key={event.id} className="flex gap-4 rounded-[24px] border border-slate-100 p-5">
                <div className={timelineDotClasses(event.type)} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm font-medium text-brand-ink">{event.title}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(event.occurredAt)}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                    {event.orderId ? <p>Pedido: {event.orderId}</p> : null}
                    {typeof event.amount === "number" ? <p>Valor: {formatCurrency(event.amount)}</p> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-brand-surface p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-brand-ink">{value}</p>
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

function timelineDotClasses(type: "last_purchase" | "first_dispatch" | "recovered_order"): string {
  if (type === "last_purchase") {
    return "mt-1 h-3 w-3 rounded-full bg-slate-400";
  }

  if (type === "first_dispatch") {
    return "mt-1 h-3 w-3 rounded-full bg-brand-blue";
  }

  return "mt-1 h-3 w-3 rounded-full bg-brand-success";
}
