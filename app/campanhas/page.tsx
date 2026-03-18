import { PageHeader } from "@/components/page-header";

const groups = [
  { status: "Atencao", templates: ["Janela cruzada", "Recompra sugerida", "Oferta leve"] },
  { status: "Em risco", templates: ["Retomar pedido", "Mix em falta", "Contato consultivo"] },
  { status: "Inativo", templates: ["Reativacao comercial", "Condicao de retorno", "Carteira parada"] }
];

export default function CampanhasPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Campanhas"
        title="Templates limitados, operacao controlada"
        description="O MVP restringe campanhas a um conjunto pequeno por status para evitar complexidade artificial e proteger a validacao do canal."
      />

      <section className="grid gap-6 lg:grid-cols-3">
        {groups.map((group) => (
          <article key={group.status} className="rounded-[32px] bg-white p-6 shadow-panel">
            <p className="text-sm text-slate-500">{group.status}</p>
            <div className="mt-5 space-y-3">
              {group.templates.map((template) => (
                <div key={template} className="rounded-[24px] border border-slate-100 p-4">
                  <p className="font-medium">{template}</p>
                  <p className="mt-1 text-sm text-slate-500">Template ativo no limite MVP.</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
