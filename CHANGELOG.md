
# CHANGELOG

## [1.0.6] - 2025-03-27

### Melhorado
- Refatorado o modelo de itens de maleta (SuitcaseItemModel) para melhorar a organização e manutenibilidade
- Dividido em módulos menores com responsabilidades específicas:
  - BaseItemModel: funções utilitárias e de transformação de dados
  - ItemQueryModel: consultas e busca de itens
  - ItemOperationsModel: operações de adição, remoção e atualização
  - ItemSalesModel: gerenciamento de vendas de itens
- Corrigido bug crítico onde itens permaneciam na maleta após finalização do acerto
- Melhorada a verificação de disponibilidade de itens para evitar conflitos
- Implementada melhor gestão de erros e logs de depuração

## [1.0.5] - 2025-03-26

### Melhorado
- Refatorado o controlador de acertos de maleta (acertoMaletaController) para melhorar a organização e manutenibilidade
- Dividido em módulos menores com responsabilidades específicas:
  - AcertoListController: listagem e busca de acertos
  - AcertoDetailsController: detalhes de acertos
  - AcertoOperationsController: criação, atualização e exclusão
  - AcertoReportController: geração de PDFs e relatórios
  - AcertoAnalyticsController: análises e estatísticas
  - AcertoFormattingUtils: funções de formatação

## [1.0.4] - 2025-03-25

### Corrigido
- Corrigido bug crítico onde itens permaneciam na maleta após a finalização do acerto
- Implementada exclusão completa dos itens da maleta após o acerto (tanto vendidos quanto verificados)
- Melhorado o processamento de itens para garantir que sejam removidos da tabela suitcase_items
- Adicionados logs detalhados para facilitar depuração de problemas futuros

### Melhorado
- Lógica de processamento de acertos para evitar inconsistências de dados
- Tratamento de erros durante o processamento de itens vendidos

## [1.0.3] - 2025-03-20

### Adicionado
- Implementado módulo de etiquetas personalizadas
- Adicionada funcionalidade para criar e gerenciar modelos de etiquetas
- Integração com a janela modal de impressão de etiquetas
- Suporte a diferentes tamanhos e configurações de etiquetas

### Melhorado
- Interface de impressão de etiquetas com suporte a modelos personalizados
- Validação de dados no formulário de criação de etiquetas
- Feedback visual durante operações de salvamento

## [1.0.2] - 2025-03-15

### Removido
- Removido módulo de etiquetas customizadas que não estava em uso
- Eliminados componentes, controladores e modelos relacionados a etiquetas customizadas para manter o código limpo

### Melhorado
- Limpeza de código para maior modularidade e robustez
- Remoção de dependências não utilizadas para melhorar a manutenção
- Corrigido erro que ocorria ao remover o módulo de etiquetas customizadas

## [1.0.1] - 2025-03-10

### Corrigido
- Corrigido erro que causava tela em branco nas páginas de fornecedores, categorias e etiquetas customizadas
- Implementada função `checkIsUserAdmin` no `AuthModel` para corrigir erro de verificação de permissões
- Atualizado `AuthController` para utilizar corretamente os métodos do `AuthModel`
- Melhorado o sistema de carregamento nas rotas para evitar chamadas de API sem autenticação válida
- Adicionado tratamento adequado de estados de carregamento em todas as rotas

### Melhorado
- Padronização do processo de verificação de autenticação em todas as rotas
- Implementação de verificação de permissões mais robusta
- Adicionado indicador visual durante carregamento das páginas

### Segurança
- Melhorada a verificação de permissões de administrador
- Controle de acesso mais robusto em todas as rotas sensíveis
