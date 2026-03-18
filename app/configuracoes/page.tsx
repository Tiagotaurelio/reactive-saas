import { PageHeader } from "@/components/page-header";

export default function ConfiguracoesPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Configuracoes"
        title="Minimo necessario para operar"
        description="Configuracoes no MVP devem ficar restritas ao essencial: tenant, notificacoes e pontos de extensao que nao comprometam a atribuicao."
      />

      <section className="grid gap-6 lg:grid-cols-2">
        {[
          "Tenant e identidade operacional",
          "Preferencias de notificacao",
          "Ajustes futuros de score",
          "Provider adapter placeholder"
        ].map((item) => (
          <article key={item} className="rounded-[32px] bg-white p-6 shadow-panel">
            <h3 className="text-xl font-semibold">{item}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Area reservada para configuracao minima, sem expandir para administracao excessiva nesta fase do produto.
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
