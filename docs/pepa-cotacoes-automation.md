# Automacao de cotacoes PEPA

## Objetivo

Substituir a comparacao manual entre:

- arquivo exportado do ERP Flex
- respostas de fornecedores recebidas por WhatsApp em PDF, Excel ou outros anexos

pela consolidacao automatica em uma tela unica para o comprador.

## Leitura dos anexos recebidos

Com base nos arquivos enviados:

- `Orcamento_4910PEPA-20409.pdf`: arquivo exportado do Flex. Deve virar a fonte mestra dos itens, quantidades e da sequencia de exibicao.
- `Pepa Distr de Mat Elet e de Const Ltda 825918.pdf`: resposta de fornecedor com texto extraivel.
- `20409.pdf`: resposta com comportamento de PDF escaneado ou imagem sem texto extraivel.
- `2113.pdf`: mesmo comportamento do arquivo `20409.pdf`.

Conclusao pratica: a automacao deve funcionar por importacao de arquivos, com pipeline hibrido:

1. parser deterministico para arquivos com texto
2. OCR apenas para anexos escaneados
3. reconciliacao por SKU, descricao, unidade e quantidade
4. reorganizacao final conforme a ordem do arquivo-base exportado do Flex
5. tela web para decisao do comprador

## Melhor caminho tecnico

### Nao recomendo como base principal

- RPA desktop clicando no ERP Flex
- automacao puramente via n8n ou Make
- comparar PDFs diretamente sem normalizar os itens antes

Essas opcoes sao frageis para layouts variaveis, anexos por WhatsApp e consistencia operacional.

### Recomendo como base

- frontend e backoffice: Next.js
- banco operacional: Postgres
- fila de processamento: background job simples
- leitura de arquivo-base: parser por template
- leitura de resposta de fornecedor: parser por template
- OCR de fallback: Azure Document Intelligence ou Google Document AI

## Fluxo MVP recomendado

1. comprador exporta o arquivo-base do Flex
2. comprador importa o arquivo-base no sistema
3. comprador importa os arquivos de resposta dos fornecedores
4. sistema identifica se cada arquivo e texto nativo ou OCR
5. sistema extrai e normaliza os itens
6. sistema compara cada retorno contra o arquivo-base
7. sistema reorganiza a saida na mesma sequencia do arquivo-base
8. comprador valida excecoes e decide
9. sistema exporta o consolidado final para apoiar a montagem do pedido

## Fases de entrega

### Fase 1

- upload manual do arquivo-base e dos anexos dos fornecedores
- parser do arquivo exportado do Flex
- parser do primeiro fornecedor com texto
- OCR fallback para anexos escaneados
- dashboard de comparacao

### Fase 2

- historico de rodadas de cotacao
- exportacao final em Excel ou CSV
- auditoria da validacao do comprador

### Fase 3

- captura automatica de anexos do WhatsApp
- melhorias de leitura de multiplos layouts de fornecedores
- indicadores de performance de compra

## O que foi implementado nesta iteracao

No app `reactive-saas`, foi criada a rota `/cotacoes-pepa` com:

- painel de anexos recebidos
- identificacao do que ja foi lido e do que depende de OCR
- ranking operacional de fornecedores
- mapa comparativo item a item

Tambem foi criada a rota `/validacao-compra-pepa` para representar a etapa seguinte ao comparativo:

- checklist de excecoes e alertas
- consolidado comercial por fornecedor
- grade de validacao final por item antes do pedido

Tambem foi criada a rota `/pedido-final-pepa` para representar a saida final da automacao:

- consolidado final do pedido
- pacote pronto para exportacao
- grade final exportavel mantendo a ordem do arquivo-base

Limitacao atual: enquanto o parser do arquivo exportado do Flex nao foi configurado, as quantidades exibidas no comparativo foram inferidas a partir da cotacao extraida da Irimar apenas para demonstrar a superficie operacional.
