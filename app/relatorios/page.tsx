import { PageHeader } from "@/components/page-header";

export default function RelatoriosPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Relatorios"
        title="Resultado atribuido por periodo e responsavel"
        description="Relatorios do MVP devem reforcar prova de valor: receita recuperada, clientes reativados, resposta e impacto por vendedor."
      />

      <section className="grid gap-6 md:grid-cols-2">
        {[
          "Receita recuperada por periodo",
          "Clientes reativados por periodo",
          "Desempenho de disparos e respostas",
          "Receita recuperada por vendedor"
        ].map((card) => (
          <article key={card} className="rounded-[32px] bg-white p-6 shadow-panel">
            <p className="text-sm text-slate-500">Visao</p>
            <h3 className="mt-2 text-xl font-semibold">{card}</h3>
            <div className="mt-6 h-48 rounded-[24px] bg-brand-surface" />
          </article>
        ))}
      </section>
    </div>
  );
}
