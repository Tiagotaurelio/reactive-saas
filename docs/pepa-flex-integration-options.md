# Modelo operacional PEPA x arquivo exportado do Flex

## Objetivo

Definir como a automacao de cotacoes opera a partir do arquivo exportado do Flex para que:

1. o arquivo-base saia do ERP
2. as respostas dos fornecedores sejam comparadas automaticamente
3. a decisao do comprador fique organizada em tela
4. o pedido final seja exportado para apoiar o processo oficial da PEPA

## O que entra no sistema

- numero do espelho ou cotacao
- SKU ou codigo interno
- descricao
- unidade
- quantidade solicitada
- observacoes comerciais
- contexto da compra, se existir

## O que sai do sistema

- fornecedor escolhido por item
- preco aprovado
- condicao de pagamento
- frete
- observacoes de divergencia
- status da analise
- itens pendentes ou sem cotacao
- consolidado final para montagem do pedido
- ordem original do item no arquivo-base

## Modelo confirmado

### Como funciona

- o comprador exporta do Flex um Excel, CSV ou PDF
- a automacao le esse arquivo como fonte oficial
- compara com os arquivos recebidos dos fornecedores
- o comprador valida em tela
- a automacao gera um arquivo final padronizado
- esse arquivo serve como base para concluir o pedido final

### Vantagens

- nao depende de API
- reduz dependencia tecnica da Flex
- mais robusto do que RPA de tela
- facilita testes em paralelo
- preserva a ordem original do arquivo-base

### Riscos

- exige disciplina operacional de exportar e importar arquivos
- o layout do arquivo-base pode mudar e exigir ajuste do parser
- diferentes fornecedores podem responder em formatos muito distintos

## Recomendacao pragmatica

Com a confirmacao de que nao existe integracao nativa com o Flex, o desenho correto para a PEPA e:

- camada 1: importacao do arquivo-base exportado do Flex
- camada 2: leitura dos arquivos dos fornecedores
- camada 3: comparativo e validacao do comprador
- camada 4: exportacao final para fechamento do pedido

## Arquitetura recomendada

### Modulos principais

- ingestao do arquivo-base do Flex
- ingestao dos PDFs e anexos dos fornecedores
- extracao e OCR
- normalizacao de itens
- motor comparativo
- reordenacao pela sequencia do arquivo-base
- tela de validacao do comprador
- exportacao do consolidado final
- auditoria e historico

## Fases sugeridas do projeto

### Fase 1

- parser do arquivo-base do Flex
- parser das cotacoes em PDF
- comparativo em tela
- validacao final do comprador

### Fase 2

- exportacao final em Excel ou CSV
- geracao assistida do pedido final
- historico de rodadas

### Fase 3

- captura automatica de anexos do WhatsApp
- ampliacao de templates de fornecedores
- indicadores de performance de compra

## O que pedir agora para a Flex

- modelo real de exportacao do arquivo-base
- exemplos de Excel, CSV ou PDF emitidos pelo sistema
- padrao dos codigos de item e quantidades
- frequencia com que o layout do arquivo muda

## Conclusao

Sim, a automacao pode ser feita mesmo sem integracao nativa. O comprador importa o arquivo exportado do Flex, importa os retornos dos fornecedores e recebe o comparativo final reorganizado na mesma ordem original do arquivo-base.
