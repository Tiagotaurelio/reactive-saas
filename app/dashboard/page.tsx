"use client";

import { OperationFeedback } from "@/components/operation-feedback";
import { PageHeader } from "@/components/page-header";
import { useReactiveSnapshot } from "@/lib/use-reactive-snapshot";

export default function DashboardPage() {
  const { snapshot, isLoading, error } = useReactiveSnapshot();
  const topCustomers = snapshot.customers.slice(0, 4);
  const recoveredCustomers = snapshot.customers.filter((customer) => customer.recoveredRevenue > 0);
  const dispatchCoverage = snapshot.customers.filter((customer) => customer.firstAutoDispatchAt).length;
  const waitingThreads = snapshot.inboxThreads.filter((thread) => thread.waiting).length;
  const latestImportJob = snapshot.importJobs[0] ?? null;

  return (
    <div>
      <PageHeader
        eyebrow="Dashboard"
        title="Quanto foi recuperado e onde esta o proximo dinheiro"
        description="A tela principal do ReActive precisa provar o resultado financeiro e apontar os clientes com maior potencial de recuperacao nas proximas horas."
        action="Importar novo CSV"
        actionHref="/importar-csv"
      />

      {isLoading ? (
        <div className="mb-6">
          <OperationFeedback
            tone="info"
            title="Atualizando painel"
            message="Recalculando clientes, atribuicao e impacto financeiro da base mais recente."
          />
        </div>
      ) : null}

      {error ? (
        <div className="mb-6">
          <OperationFeedback tone="error" title="Falha ao carregar dashboard" message={error} />
        </div>
      ) : null}

      {latestImportJob ? (
        <div className="mb-6">
          <OperationFeedback
            tone={latestImportJob.invalidRows > 0 ? "warning" : "success"}
            title="Ultima importacao processada"
            message={`${latestImportJob.fileName} em ${formatDateTime(latestImportJob.createdAt)}. ${latestImportJob.importedOrders} pedidos novos, ${latestImportJob.invalidRows} linha(s) rejeitada(s) e ${latestImportJob.automaticFirstDispatches} primeiros disparos automaticos.`}
          />
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {snapshot.stats.map((stat) => (
          <article key={stat.label} className="rounded-[28px] bg-white p-5 shadow-panel">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{stat.value}</p>
            <p className="mt-3 text-sm font-medium text-brand-blue">{stat.delta}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <article className="rounded-[32px] bg-white p-6 shadow-panel">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Evolucao do periodo</p>
              <h3 className="mt-1 text-xl font-semibold">Cobertura de disparos x recuperacao</h3>
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
              Ultimos 30 dias
            </div>
          </div>
          <div className="mt-6 rounded-[28px] bg-[linear-gradient(180deg,rgba(11,98,164,0.12),rgba(11,98,164,0.02))] p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] bg-white/80 p-5">
                <p className="text-sm text-slate-500">Clientes com 1o disparo salvo</p>
                <p className="mt-3 text-4xl font-semibold">{dispatchCoverage}</p>
                <p className="mt-2 text-sm text-slate-500">
                  So pedidos posteriores a esse marco entram na atribuicao.
                </p>
              </div>
              <div className="rounded-[24px] bg-white/80 p-5">
                <p className="text-sm text-slate-500">Clientes com receita recuperada</p>
                <p className="mt-3 text-4xl font-semibold">{recoveredCustomers.length}</p>
                <p className="mt-2 text-sm text-slate-500">
                  O valor recuperado aparece apenas quando um novo pedido chega depois do 1o disparo.
                </p>
              </div>
              <div className="rounded-[24px] bg-white/80 p-5 md:col-span-2">
                <p className="text-sm text-slate-500">Threads aguardando handoff</p>
                <p className="mt-3 text-4xl font-semibold">{waitingThreads}</p>
                <p className="mt-2 text-sm text-slate-500">
                  Replies recebidos que ainda exigem acao comercial do vendedor responsavel.
                </p>
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-[32px] bg-white p-6 shadow-panel">
          <p className="text-sm text-slate-500">Ranking de prioridade</p>
          <h3 className="mt-1 text-xl font-semibold">Proximos clientes para recuperar receita</h3>
          <div className="mt-6 space-y-4">
            {topCustomers.map((customer) => (
              <div key={customer.name} className="rounded-3xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{customer.seller}</p>
                  </div>
                  <span className={statusClasses(customer.status)}>
                    {customer.status}
                  </span>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-brand-muted">Score</p>
                    <p className="text-2xl font-semibold">{customer.priorityScore}</p>
                  </div>
                  <p className="text-sm text-slate-500">{customer.lagLabel}</p>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-500">
                  <p>
                    1o disparo:{" "}
                    {customer.firstAutoDispatchAt ? formatDateTime(customer.firstAutoDispatchAt) : "nao registrado"}
                  </p>
                  <p>Receita recuperada: {formatCurrency(customer.recoveredRevenue)}</p>
                </div>
              </div>
            ))}
            {topCustomers.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                Importe um CSV para gerar o ranking real de prioridade.
              </div>
            ) : null}
          </div>
        </article>
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
