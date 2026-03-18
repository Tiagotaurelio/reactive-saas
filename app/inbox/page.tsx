"use client";

import Link from "next/link";

import { OperationFeedback } from "@/components/operation-feedback";
import { PageHeader } from "@/components/page-header";
import { useReactiveSnapshot } from "@/lib/use-reactive-snapshot";

export default function InboxPage() {
  const { snapshot, isLoading, error } = useReactiveSnapshot();

  return (
    <div>
      <PageHeader
        eyebrow="Inbox"
        title="Resposta recebida, operacao pausada, vendedor acionado"
        description="O inbox do MVP existe para handoff rapido. Ele nao tenta resolver CRM, apenas expor resposta, contexto e proximo responsavel."
      />

      {isLoading ? (
        <div className="mb-6">
          <OperationFeedback tone="info" title="Atualizando inbox" message="Carregando threads, handoffs e mensagens recentes." />
        </div>
      ) : null}

      {error ? (
        <div className="mb-6">
          <OperationFeedback tone="error" title="Falha ao carregar inbox" message={error} />
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-[32px] bg-white p-6 shadow-panel">
          <p className="text-sm text-slate-500">Threads aguardando acao</p>
          <div className="mt-5 space-y-4">
            {snapshot.inboxThreads.map((thread) => (
              <div key={thread.customer} className="rounded-[28px] border border-slate-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{thread.customer}</p>
                    <p className="text-sm text-slate-500">{thread.seller}</p>
                  </div>
                  {thread.waiting ? (
                    <span className="rounded-full bg-brand-danger/10 px-3 py-1 text-xs font-semibold text-brand-danger">
                      waiting
                    </span>
                  ) : (
                    <span className="rounded-full bg-brand-success/10 px-3 py-1 text-xs font-semibold text-brand-success">
                      handoff concluido
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm text-slate-600">{thread.lastInbound || thread.lastOutbound}</p>
                <div className="mt-4">
                  <Link
                    className="rounded-full bg-brand-blue px-4 py-2 text-sm font-medium text-white"
                    href={`/inbox/${thread.customerId}`}
                  >
                    Abrir thread
                  </Link>
                </div>
              </div>
            ))}
            {snapshot.inboxThreads.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                Nenhuma thread aguardando acao no momento.
              </div>
            ) : null}
          </div>
        </article>

        <article className="rounded-[32px] bg-white p-6 shadow-panel">
          <p className="text-sm text-slate-500">Conversa e contexto</p>
          <h3 className="mt-2 text-2xl font-semibold">Selecione uma thread</h3>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500">
            O detalhe do inbox agora vive em uma rota dedicada. Abra uma thread para ver mensagens, handoff, score e link direto para o perfil auditavel do cliente.
          </p>
        </article>
      </section>
    </div>
  );
}
