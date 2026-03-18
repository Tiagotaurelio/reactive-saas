import Link from "next/link";

const highlights = [
  "Importacao de CSV com validacao, deduplicacao e impacto por cliente.",
  "Dashboard operacional com fila de reativacao, clientes e inbox comercial.",
  "Suite automatizada cobrindo API, importacao e UI operacional."
];

const demoFlow = [
  "Entrar com o usuario demo e abrir o dashboard.",
  "Importar um CSV em /importar-csv e observar clientes impactados.",
  "Ir para /clientes e abrir um cliente com thread aguardando acao.",
  "Fechar a narrativa em /inbox e /logs mostrando operacao rastreavel."
];

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-brand-surface px-6 py-10 text-brand-ink">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[40px] bg-white p-8 shadow-panel md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">
            ReActive Demo
          </p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">
                Recuperacao de receita com narrativa pronta para demo comercial.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                Esta rota publica resume o valor do produto, organiza o roteiro de apresentacao
                e acelera o handoff para deploy ou piloto interno.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  className="rounded-full bg-brand-blue px-5 py-3 text-sm font-medium text-white shadow-panel"
                  href="/login"
                >
                  Entrar no ambiente demo
                </Link>
                <a
                  className="rounded-full border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-brand-ink"
                  href="/api/health"
                >
                  Abrir healthcheck
                </a>
              </div>
            </div>
            <section className="rounded-[32px] bg-slate-950 p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
                Credenciais demo
              </p>
              <div className="mt-4 space-y-2 text-sm text-slate-200">
                <p>Email: admin@reactive.local</p>
                <p>Senha: demo123</p>
                <p>Storage: SQLite local ou Postgres via DATABASE_URL</p>
              </div>
            </section>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-[32px] bg-white p-8 shadow-panel">
            <p className="text-sm font-semibold text-brand-ink">O que mostrar</p>
            <div className="mt-5 space-y-3">
              {highlights.map((item) => (
                <div key={item} className="rounded-[24px] border border-slate-100 px-4 py-4 text-sm text-slate-600">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] bg-white p-8 shadow-panel">
            <p className="text-sm font-semibold text-brand-ink">Roteiro sugerido</p>
            <ol className="mt-5 space-y-3 text-sm text-slate-600">
              {demoFlow.map((step, index) => (
                <li key={step} className="rounded-[24px] border border-slate-100 px-4 py-4">
                  <span className="mr-2 font-semibold text-brand-ink">{index + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </main>
  );
}
