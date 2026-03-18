"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { OperationFeedback } from "@/components/operation-feedback";
import { PageHeader } from "@/components/page-header";
import { useReactiveSnapshot } from "@/lib/use-reactive-snapshot";

export default function InboxThreadPage() {
  const params = useParams<{ customerId: string }>();
  const { snapshot, isLoading, error } = useReactiveSnapshot();
  const threadMatch = snapshot.inboxThreads.find((entry) => entry.customerId === params.customerId);
  const customerMatch = snapshot.customers.find((entry) => entry.customerId === params.customerId);
  const [outboundDraft, setOutboundDraft] = useState("");
  const [inboundDraft, setInboundDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operationMessage, setOperationMessage] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);

  if (isLoading) {
    return (
      <div>
        <div className="mb-6">
          <Link className="text-sm font-medium text-brand-blue" href="/inbox">
            Voltar para inbox
          </Link>
        </div>
        <OperationFeedback tone="info" title="Atualizando thread" message="Carregando mensagens, contexto e handoff deste cliente." />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="mb-6">
          <Link className="text-sm font-medium text-brand-blue" href="/inbox">
            Voltar para inbox
          </Link>
        </div>
        <OperationFeedback tone="error" title="Falha ao carregar thread" message={error} />
      </div>
    );
  }

  if (!threadMatch || !customerMatch) {
    notFound();
  }

  const thread = threadMatch;
  const customer = customerMatch;

  async function mutateInbox(payload: {
    type: "complete_handoff" | "add_outbound" | "add_inbound";
    body?: string;
  }) {
    setIsSubmitting(true);
    setOperationMessage({
      tone: "info",
      text:
        payload.type === "complete_handoff"
          ? "Fechando handoff e atualizando a fila operacional."
          : payload.type === "add_outbound"
            ? "Registrando mensagem de saida."
            : "Registrando nova resposta recebida."
    });

    const response = await fetch("/api/reactive/inbox", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        customerId: customer.customerId,
        ...payload
      })
    });

    if (!response.ok) {
      setOperationMessage({
        tone: "error",
        text: "Nao foi possivel atualizar esta thread agora."
      });
      setIsSubmitting(false);
      return;
    }

    window.dispatchEvent(new Event("reactive-store-updated"));
    if (payload.type === "add_outbound") {
      setOutboundDraft("");
    }
    if (payload.type === "add_inbound") {
      setInboundDraft("");
    }
    setOperationMessage({
      tone: "success",
      text:
        payload.type === "complete_handoff"
          ? "Handoff concluido com sucesso."
          : payload.type === "add_outbound"
            ? "Mensagem de saida registrada com sucesso."
            : "Mensagem inbound registrada com sucesso."
    });

    setIsSubmitting(false);
  }

  function handleOutboundSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!outboundDraft.trim()) {
      return;
    }
    void mutateInbox({ type: "add_outbound", body: outboundDraft });
  }

  function handleInboundSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!inboundDraft.trim()) {
      return;
    }
    void mutateInbox({ type: "add_inbound", body: inboundDraft });
  }

  return (
    <div>
      <div className="mb-6">
        <Link className="text-sm font-medium text-brand-blue" href="/inbox">
          Voltar para inbox
        </Link>
      </div>

      <PageHeader
        eyebrow="Inbox thread"
        title={thread.customer}
        description="Resposta recebida, automacao pausada e contexto operacional do cliente em uma unica superficie."
      />

      <div className="mb-6">
        <OperationFeedback
          tone={thread.waiting ? "warning" : "success"}
          title={thread.waiting ? "Thread aguardando acao comercial" : "Thread sem pendencia imediata"}
          message={
            thread.waiting
              ? "A automacao deve permanecer pausada ate o vendedor tratar esta resposta e concluir o handoff."
              : "A ultima interacao ja foi tratada. Registre novas mensagens apenas se surgir novo contato do cliente."
          }
        />
      </div>

      {operationMessage ? (
        <div className="mb-6">
          <OperationFeedback
            tone={operationMessage.tone}
            title={
              operationMessage.tone === "success"
                ? "Thread atualizada"
                : operationMessage.tone === "error"
                  ? "Falha na thread"
                  : "Atualizando thread"
            }
            message={operationMessage.text}
          />
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <article className="rounded-[32px] bg-white p-6 shadow-panel">
          <div className="flex flex-wrap items-center gap-3">
            <span className={statusClasses(customer.status)}>{customer.status}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              Score {customer.priorityScore}
            </span>
            {thread.waiting ? (
              <span className="rounded-full bg-brand-danger/10 px-3 py-1 text-xs font-semibold text-brand-danger">
                Waiting for action
              </span>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4">
            <MetricCard label="Vendedor responsavel" value={thread.seller} />
            <MetricCard label="Ultima compra" value={formatDate(customer.lastPurchaseAt)} />
            <MetricCard
              label="Primeiro disparo automatico"
              value={customer.firstAutoDispatchAt ? formatDateTime(customer.firstAutoDispatchAt) : "Nao registrado"}
            />
            <MetricCard label="Receita recuperada" value={formatCurrency(customer.recoveredRevenue)} />
          </div>

          <div className="mt-6 rounded-[24px] bg-brand-surface p-4">
            <p className="text-sm text-slate-500">Acoes rapidas</p>
            <p className="mt-2 text-sm text-slate-600">
              {thread.waiting
                ? "Use o handoff quando o vendedor assumir a conversa fora da automacao."
                : "A thread esta resolvida. Registre nova mensagem apenas se o cliente voltar a responder."}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-brand-blue px-4 py-2 text-sm font-medium text-white"
                href={`/clientes/${customer.customerId}`}
              >
                Abrir perfil do cliente
              </Link>
              <button
                className="rounded-full bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting || !thread.waiting}
                onClick={() => void mutateInbox({ type: "complete_handoff" })}
              >
                Marcar handoff concluido
              </button>
            </div>
          </div>
        </article>

        <article className="rounded-[32px] bg-white p-6 shadow-panel">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm text-slate-500">Conversa</p>
              <h3 className="mt-1 text-2xl font-semibold">Historico de mensagens</h3>
            </div>
            <p className="text-sm text-slate-500">Ultima mensagem: {formatDateTime(thread.messages.at(-1)?.occurredAt ?? new Date().toISOString())}</p>
          </div>

          <div className="mt-6 space-y-4">
            {thread.messages.map((message) => (
              <div
                key={message.id}
                className={[
                  "max-w-2xl rounded-[24px] p-4 text-sm",
                  message.direction === "inbound"
                    ? "ml-auto bg-brand-blue text-white"
                    : "bg-slate-100 text-slate-700"
                ].join(" ")}
              >
                <p>{message.direction === "inbound" ? "Cliente" : "Sistema"}: {message.body}</p>
                <p
                  className={[
                    "mt-2 text-xs",
                    message.direction === "inbound" ? "text-blue-100" : "text-slate-500"
                  ].join(" ")}
                >
                  {formatDateTime(message.occurredAt)}
                </p>
              </div>
            ))}
            {thread.messages.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                Nenhuma mensagem registrada ainda nesta thread.
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <form className="rounded-[24px] bg-brand-surface p-4" onSubmit={handleOutboundSubmit}>
              <p className="text-sm font-medium text-brand-ink">Nova mensagem de saida</p>
              <textarea
                className="mt-3 min-h-28 w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                placeholder="Escreva a resposta do vendedor..."
                value={outboundDraft}
                onChange={(event) => setOutboundDraft(event.target.value)}
              />
              <button
                className="mt-3 rounded-full bg-brand-blue px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting || !outboundDraft.trim()}
                type="submit"
              >
                Enviar saida
              </button>
            </form>

            <form className="rounded-[24px] bg-brand-surface p-4" onSubmit={handleInboundSubmit}>
              <p className="text-sm font-medium text-brand-ink">Registrar resposta recebida</p>
              <textarea
                className="mt-3 min-h-28 w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                placeholder="Simule uma nova mensagem inbound..."
                value={inboundDraft}
                onChange={(event) => setInboundDraft(event.target.value)}
              />
              <button
                className="mt-3 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting || !inboundDraft.trim()}
                type="submit"
              >
                Registrar inbound
              </button>
            </form>
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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short"
  }).format(new Date(value));
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
