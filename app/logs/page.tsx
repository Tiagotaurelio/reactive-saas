"use client";

import { OperationFeedback } from "@/components/operation-feedback";
import { PageHeader } from "@/components/page-header";
import { useReactiveSnapshot } from "@/lib/use-reactive-snapshot";

export default function LogsPage() {
  const { snapshot, isLoading, error } = useReactiveSnapshot();

  return (
    <div>
      <PageHeader
        eyebrow="Logs"
        title="Trilha de confianca para importacao, disparo e atribuicao"
        description="Logs sao parte do produto. A operacao precisa conseguir provar quando a reativacao aconteceu e por que uma receita foi atribuida."
      />

      {isLoading ? (
        <div className="mb-6">
          <OperationFeedback tone="info" title="Atualizando trilha de auditoria" message="Carregando eventos mais recentes de importacao, disparo e handoff." />
        </div>
      ) : null}

      {error ? (
        <div className="mb-6">
          <OperationFeedback tone="error" title="Falha ao carregar logs" message={error} />
        </div>
      ) : null}

      <section className="rounded-[32px] bg-white p-6 shadow-panel">
        <div className="space-y-4">
          {snapshot.auditEvents.map((event) => (
            <div key={event.id} className="rounded-[24px] border border-slate-100 px-4 py-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-ink">{event.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{event.description}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-brand-muted">
                    {event.type} · {event.entityId}
                  </p>
                </div>
                <p className="text-xs text-slate-500">{formatDateTime(event.occurredAt)}</p>
              </div>
            </div>
          ))}
          {snapshot.auditEvents.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-200 px-4 py-4 text-sm text-slate-500">
              Nenhum evento auditavel registrado ainda.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}
