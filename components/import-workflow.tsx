"use client";

import Link from "next/link";
import { ChangeEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { OperationFeedback } from "@/components/operation-feedback";
import {
  ColumnMapping,
  createDefaultMapping,
  getHeaders,
  parseCsv,
  requiredFields,
  sampleCsv,
  validateRows
} from "@/lib/reactive-domain";

type LoadedFile = {
  fileName: string;
  headers: string[];
  rows: Record<string, string>[];
};

type ImportImpact = {
  duplicateOrders: number;
  impactedCustomers: Array<{
    customerId: string;
    name: string;
    seller: string;
    status: string;
    priorityScore: number;
    recoveredRevenue: number;
  }>;
};

export function ImportWorkflow() {
  const router = useRouter();
  const [loadedFile, setLoadedFile] = useState<LoadedFile | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [jobMessage, setJobMessage] = useState<{ tone: "success" | "error" | "warning" | "info"; text: string } | null>(null);
  const [latestImpact, setLatestImpact] = useState<ImportImpact | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validation = useMemo(() => {
    if (!loadedFile || !mapping || hasMissingMapping(mapping)) {
      return null;
    }

    return validateRows(loadedFile.rows, mapping);
  }, [loadedFile, mapping]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setJobMessage({
        tone: "error",
        text: "Envie um arquivo CSV valido para continuar."
      });
      setLoadedFile(null);
      setMapping(null);
      setLatestImpact(null);
      return;
    }

    const text = await file.text();
    const headers = getHeaders(text);
    const rows = parseCsv(text);

    if (headers.length === 0 || rows.length === 0) {
      setJobMessage({
        tone: "error",
        text: "O arquivo foi lido, mas nao trouxe cabecalho ou linhas suficientes para importacao."
      });
      setLoadedFile(null);
      setMapping(null);
      setLatestImpact(null);
      return;
    }

    setLoadedFile({
      fileName: file.name,
      headers,
      rows
    });
    setMapping(createDefaultMapping(headers));
    setJobMessage({
      tone: "info",
      text: `${rows.length} linha(s) carregada(s). Revise o mapeamento e o preview antes de processar.`
    });
    setLatestImpact(null);
  }

  function handleMappingChange(field: keyof ColumnMapping, value: string) {
    setMapping((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [field]: value
      };
    });
  }

  function handleSampleDownload() {
    const blob = new Blob([sampleCsv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reactive-sample.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleProcessImport() {
    if (!loadedFile || !validation) {
      return;
    }

    if (validation.validOrders.length === 0) {
      setJobMessage({
        tone: "error",
        text: "Nao ha linhas validas para processar nesta importacao."
      });
      return;
    }

    if (validation.rejectedRows.length > 0) {
      const shouldContinue = window.confirm(
        [
          "Existem linhas rejeitadas nesta importacao.",
          `Linhas validas: ${validation.validOrders.length}`,
          `Linhas rejeitadas: ${validation.rejectedRows.length}`,
          "Deseja continuar mesmo assim?"
        ].join("\n")
      );

      if (!shouldContinue) {
        setJobMessage({
          tone: "warning",
          text: "Processamento cancelado. Revise as linhas rejeitadas antes de importar."
        });
        return;
      }
    }

    setIsSubmitting(true);
    setJobMessage({
      tone: "info",
      text: "Persistindo importacao, recalculando snapshot e consolidando impactos operacionais."
    });

    const response = await fetch("/api/reactive/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fileName: loadedFile.fileName,
        totalRows: loadedFile.rows.length,
        validOrders: validation.validOrders,
        rejectedRows: validation.rejectedRows
      })
    });

    if (!response.ok) {
      setJobMessage({
        tone: "error",
        text: "Falha ao persistir a importacao no servidor."
      });
      setIsSubmitting(false);
      return;
    }

    const payload = (await response.json()) as {
      job: {
        importedOrders: number;
        createdCustomers: number;
        updatedCustomers: number;
        invalidRows: number;
        automaticFirstDispatches: number;
      };
      impact: ImportImpact;
    };

    setJobMessage({
      tone: payload.job.invalidRows > 0 ? "warning" : "success",
      text: `Importacao concluida: ${payload.job.importedOrders} pedidos novos, ${payload.job.createdCustomers} clientes criados, ${payload.job.updatedCustomers} clientes atualizados, ${payload.job.invalidRows} linhas rejeitadas e ${payload.job.automaticFirstDispatches} primeiros disparos automaticos.`
    });
    setLatestImpact(payload.impact);
    window.dispatchEvent(new Event("reactive-store-updated"));
    router.refresh();
    setIsSubmitting(false);
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <article className="rounded-[32px] border border-dashed border-brand-blue/30 bg-white p-6 shadow-panel">
        <p className="text-sm text-slate-500">Upload</p>
        <h3 className="mt-2 text-2xl font-semibold">Arraste ou selecione um CSV</h3>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
          Campos obrigatorios: cliente, telefone, vendedor, data da compra, valor e pedido. O mapeamento de colunas acontece antes do processamento final.
        </p>

        <label className="mt-6 block rounded-[28px] bg-brand-blue px-5 py-8 text-center text-white">
          Selecionar arquivo
          <input accept=".csv,text/csv" className="hidden" type="file" onChange={handleFileChange} />
        </label>

        <button className="mt-4 text-sm font-medium text-brand-blue" onClick={handleSampleDownload}>
          Baixar arquivo de exemplo
        </button>

        <div className="mt-6 rounded-[28px] bg-brand-surface p-5">
          <p className="text-sm font-medium text-brand-ink">
            {loadedFile ? loadedFile.fileName : "Nenhum arquivo carregado"}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {loadedFile
              ? `${loadedFile.rows.length} linhas prontas para mapeamento`
              : "Assim que o arquivo for lido, o fluxo libera mapeamento, validacao e processamento."}
          </p>
        </div>

        {jobMessage ? (
          <div className="mt-6">
            <OperationFeedback
              tone={jobMessage.tone}
              title={
                jobMessage.tone === "success"
                  ? "Importacao concluida"
                  : jobMessage.tone === "error"
                    ? "Falha na importacao"
                    : jobMessage.tone === "warning"
                      ? "Importacao com ressalvas"
                      : "Importacao em preparacao"
              }
              message={jobMessage.text}
            />
          </div>
        ) : null}

        {latestImpact ? (
          <div className="mt-4 rounded-[28px] border border-brand-blue/15 bg-brand-blue/5 p-5">
            <p className="text-sm font-medium text-brand-ink">Impacto operacional imediato</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <SummaryCard label="Pedidos duplicados ignorados" value={String(latestImpact.duplicateOrders)} />
              <SummaryCard label="Clientes afetados" value={String(latestImpact.impactedCustomers.length)} />
            </div>
            <div className="mt-4 space-y-3">
              {latestImpact.impactedCustomers.map((customer) => (
                <div key={customer.customerId} className="rounded-3xl bg-white p-4 text-sm text-slate-600">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-brand-ink">{customer.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-brand-muted">
                        {customer.seller} · Score {customer.priorityScore}
                      </p>
                    </div>
                    <span className={statusClasses(customer.status)}>{customer.status}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p>Receita recuperada: {formatCurrency(customer.recoveredRevenue)}</p>
                    <Link className="text-sm font-medium text-brand-blue" href={`/clientes/${customer.customerId}`}>
                      Abrir detalhe
                    </Link>
                  </div>
                </div>
              ))}
              {latestImpact.impactedCustomers.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nenhum cliente novo entrou no ranking com este arquivo.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </article>

      <div className="space-y-6">
        <article className="rounded-[32px] bg-white p-6 shadow-panel">
          <p className="text-sm text-slate-500">Mapeamento</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {requiredFields.map((field) => (
              <label key={field} className="grid gap-2 text-sm text-slate-600">
                <span className="font-medium text-brand-ink">{field}</span>
                <select
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  disabled={!loadedFile}
                  value={mapping?.[field] ?? ""}
                  onChange={(event) => handleMappingChange(field, event.target.value)}
                >
                  <option value="">Selecionar coluna</option>
                  {loadedFile?.headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </article>

        <article className="rounded-[32px] bg-white p-6 shadow-panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Validacao</p>
              <h3 className="mt-1 text-xl font-semibold">Preview antes do processamento</h3>
            </div>
            <button
              className="rounded-full bg-brand-blue px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={!validation || isSubmitting || validation.validOrders.length === 0}
              onClick={handleProcessImport}
            >
              {isSubmitting ? "Processando..." : "Processar importacao"}
            </button>
          </div>

          {!loadedFile ? (
            <p className="mt-6 text-sm text-slate-500">
              Carregue um CSV para liberar o preview de linhas validas e rejeitadas.
            </p>
          ) : null}

          {loadedFile && !validation ? (
            <p className="mt-6 text-sm text-slate-500">
              Complete o mapeamento de todos os campos obrigatorios para validar.
            </p>
          ) : null}

          {validation ? (
            <div className="mt-6 space-y-5">
              {validation.rejectedRows.length > 0 ? (
                <OperationFeedback
                  tone="warning"
                  title="Revise antes de importar"
                  message={`Esta carga tem ${validation.rejectedRows.length} linha(s) rejeitada(s). O sistema permite continuar, mas voce deve confirmar esse residual antes do processamento.`}
                />
              ) : null}

              <div className="grid gap-4 md:grid-cols-3">
                <SummaryCard label="Linhas totais" value={String(loadedFile?.rows.length ?? 0)} />
                <SummaryCard label="Linhas validas" value={String(validation.validOrders.length)} />
                <SummaryCard label="Linhas rejeitadas" value={String(validation.rejectedRows.length)} />
              </div>

              <div className="rounded-[28px] bg-brand-surface p-5">
                <p className="text-sm font-medium text-brand-ink">Primeiras linhas validas</p>
                <div className="mt-4 space-y-3">
                  {validation.validOrders.slice(0, 3).map((order) => (
                    <div key={order.orderId} className="rounded-3xl bg-white p-4 text-sm text-slate-600">
                      {order.customerName} · {order.seller} · {order.orderDate} · R${" "}
                      {order.orderValue.toFixed(2)}
                    </div>
                  ))}
                  {validation.validOrders.length === 0 ? (
                    <p className="text-sm text-slate-500">Nenhuma linha valida no arquivo atual.</p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-100 p-5">
                <p className="text-sm font-medium text-brand-ink">Linhas rejeitadas</p>
                <div className="mt-4 space-y-3">
                  {validation.rejectedRows.slice(0, 5).map((row) => (
                    <div key={`${row.rowNumber}-${row.reason}`} className="rounded-3xl bg-brand-danger/5 p-4 text-sm text-slate-600">
                      Linha {row.rowNumber}: {row.reason}
                    </div>
                  ))}
                  {validation.rejectedRows.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Nenhuma rejeicao nesta validacao. O dataset esta pronto para consolidacao.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </article>
      </div>
    </section>
  );
}

function hasMissingMapping(mapping: ColumnMapping): boolean {
  return requiredFields.some((field) => !mapping[field]);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  }).format(value);
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

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[28px] bg-brand-surface p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-brand-ink">{value}</p>
    </div>
  );
}
