import { PageHeader } from "@/components/page-header";
import { ImportWorkflow } from "@/components/import-workflow";

export default function ImportarCsvPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Importacao"
        title="CSV como fonte de verdade"
        description="O fluxo precisa aceitar dados imperfeitos sem comprometer a atribuicao. O usuario deve entender antes de processar o que sera aceito, rejeitado e recalculado."
      />
      <ImportWorkflow />
    </div>
  );
}
