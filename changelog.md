# CHANGELOG

## [2025-03-28] - Implementação do Agrupamento de Itens e Opções de Devolução e Itens Danificados
**Desenvolvedor:** Equipe Dalia Manager

### Adições
- Agrupamento visual de itens idênticos na maleta, mostrando uma linha por tipo de produto
- Adição de opções para marcar itens como "Devolver ao Estoque" ou "Danificado"
- Criação de tabela para registro de itens danificados no banco de dados

### Alterações
- Substituição da opção "Vendido" por controles para devolução/marcação de dano
- Refatoração do controle de itens para trabalhar com lotes de itens idênticos
- Melhoria na exibição de quantidades de itens na maleta
- Nova interface para processamento em lote de itens da maleta

### Correções
- Correção no processamento de itens retornados ao estoque
- Tratamento adequado para diferentes quantidades de itens idênticos

### Técnico
- Criação de novo tipo `GroupedSuitcaseItem` para facilitar o agrupamento de itens
- Adição do status `damaged` à enum `SuitcaseItemStatus`
- Criação da tabela `inventory_damaged_items` para rastreamento de itens danificados

## [2025-03-27] - Refatoração dos Componentes da Maleta
**Desenvolvedor:** Equipe Dalia Manager

### Alterações
- Refatoração do componente SuitcaseItems para melhor legibilidade
- Criação de componentes menores e mais focados (SearchResults, GroupedItemsList, SummarySection)
- Melhoria na organização do código para facilitar manutenção futura

## [2025-03-25] - Correção no Processo de Acerto
**Desenvolvedor:** Equipe Dalia Manager

### Correções
- Correção definitiva no processamento de acerto de maletas
- Resolução do problema de itens que permaneciam na maleta após o acerto

## 2025-03-29
- Implementação de melhorias no módulo de abastecimento de maletas:
  - Corrigido bug nos botões de incremento/decremento de quantidade
  - Adicionada exibição de miniaturas de imagens dos produtos
  - Implementada exibição de itens existentes na maleta ao abrir o diálogo de abastecimento
  - Aprimorada a geração de PDF com imagens e informações detalhadas
  - Refatorado o componente para melhor manutenção e estabilidade
  - Desenvolvedor: Equipe Dalia Manager

## 2025-03-27
- Correção de interface do componente SuitcaseFilters:
  - Substituídos props `onSearch` e `onClear` por `onFiltersChange` para consistência
  - Corrigida incompatibilidade de tipos entre componentes
  - Melhorada a inicialização e manipulação de filtros
  - Desenvolvedor: Equipe Dalia Manager

## 2025-03-26
- Correção de erros de tipo e exportação:
  - Adicionada exportação `getPromoterForReseller` no controlador combinado de maletas
  - Corrigido tipo `SuitcaseFilters` para garantir propriedades obrigatórias
  - Ajustada inicialização dos filtros no componente `SuitcasesContent`
  - Desenvolvedor: Equipe Dalia Manager

## 2023-10-25
- Correção de bugs em funções de formatação:
  - Adicionada função `formatPrice` como alias para `formatMoney` para manter compatibilidade
  - Adicionadas funções de formatação para telefone, CPF/CNPJ e CEP
  - Corrigidos erros de referência em controladores
  - Ajustada passagem de props entre componentes
  - Desenvolvedor: Equipe Dalia Manager

## 2023-10-16
- Implementada funcionalidade de abastecimento de maletas via card
  - Adicionado botão "Abastecer" no card de maletas
  - Implementado modal de busca e seleção de produtos para abastecimento
  - Adicionado suporte para quantidade de itens
  - Implementada geração de PDF de comprovante de abastecimento
  - Adicionada exibição do número de itens em cada maleta
  - Desenvolvedor: Equipe Dalia Manager

## 2023-10-12
- Corrigido bug crítico no acerto de maletas:
  - Itens vendidos não estavam sendo removidos da maleta corretamente
  - Implementada validação adicional para garantir que a maleta fique vazia após o acerto
  - Modificado fluxo de vendas para registrar itens no histórico antes de removê-los
  - Adicionados logs detalhados para auditoria de operações de acerto
  - Desenvolvedor: Equipe Dalia Manager

## 2023-10-05
- Implementada listagem de maletas por revendedora
  - Adicionada visualização de status em tempo real
  - Desenvolvedor: Equipe Dalia Manager

## 2023-09-20
- Adicionada funcionalidade de acerto de maletas
  - Interface para marcar itens como vendidos
  - Cálculo automático de comissões
  - Registro histórico de vendas
  - Desenvolvedor: Equipe Dalia Manager

## 2023-09-10
- Implementado módulo inicial de maletas
  - Cadastro de maletas
  - Vinculação com revendedoras
  - Adição/remoção de itens
  - Desenvolvedor: Equipe Dalia Manager

## 2023-08-15
- Lançamento da primeira versão do sistema
  - Módulo de estoque
  - Módulo de revendedoras
  - Módulo de promotoras
  - Desenvolvedor: Equipe Dalia Manager
