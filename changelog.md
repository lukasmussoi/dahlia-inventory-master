
# Registro de Alterações

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
