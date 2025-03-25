
# CHANGELOG

## [2025-03-28] - Correção definitiva do bug dos itens que permanecem na maleta após acerto
**Desenvolvedor:** Equipe Dalia Manager

### Alterações
1. Corrigido o bug onde itens não vendidos ainda permaneciam na maleta após o acerto.
2. Implementadas múltiplas camadas de verificação para garantir que todos os itens sejam removidos da maleta.
3. Melhorada a função de retorno ao estoque para garantir a remoção completa do item da maleta.
4. Adicionada verificação final após o acerto para garantir que a maleta fique realmente vazia.

### Detalhes da Implementação
- Modificada a função `returnItemToInventory` para explicitamente remover o item da maleta após devolver ao estoque.
- Adicionada lógica de verificação final no `AcertoMaletaModel.processAcertoItems` para identificar e remover quaisquer itens restantes.
- Implementada verificação final no componente `AcertoMaletaDialog` após finalizar o acerto.
- Adicionados logs detalhados para facilitar diagnóstico em caso de problemas futuros.

### Impacto
- Corrige definitivamente o problema onde itens permaneciam na maleta após o acerto.
- Melhora a integridade dos dados e evita confusão para os usuários.
- Garante que o comportamento esperado (maleta vazia após acerto) seja consistentemente alcançado.

## [2025-03-27] - Refatoração do modelo de itens de maleta
**Desenvolvedor:** Equipe Dalia Manager

### Alterações
1. Refatoração do SuitcaseItemModel em arquivos menores e mais focados
2. Organização em diferentes responsabilidades:
   - BaseItemModel: funções auxiliares e transformação de dados
   - ItemQueryModel: consultas ao banco de dados 
   - ItemOperationsModel: operações de adição/remoção/alteração
   - ItemSalesModel: operações relacionadas a vendas

### Detalhes da Implementação
- Arquivos criados:
  - src/models/suitcase/item/baseItemModel.ts
  - src/models/suitcase/item/itemQueryModel.ts
  - src/models/suitcase/item/itemOperationsModel.ts
  - src/models/suitcase/item/itemSalesModel.ts
  - src/models/suitcase/item/index.ts

- Manutenção da compatibilidade com o código existente através da classe SuitcaseItemModel

### Impacto
- Melhora na organização e manutenibilidade do código
- Sem alteração de comportamento ou funcionalidade
- Facilita futuros desenvolvimentos e correções

## [2025-03-26] - Refatoração do controlador de acertos
**Desenvolvedor:** Equipe Dalia Manager

### Alterações
1. Refatoração do acertoMaletaController em arquivos menores e mais focados
2. Organização em diferentes responsabilidades:
   - acertoDetailsController: detalhes de um acerto específico
   - acertoListController: listagem e filtros de acertos
   - acertoOperationsController: operações de CRUD
   - acertoReportController: geração de relatórios e PDFs
   - acertoAnalyticsController: análises e estatísticas
   - acertoFormattingUtils: funções utilitárias para formatação

### Detalhes da Implementação
- Arquivos criados:
  - src/controllers/acertoMaleta/acertoDetailsController.ts
  - src/controllers/acertoMaleta/acertoListController.ts
  - src/controllers/acertoMaleta/acertoOperationsController.ts
  - src/controllers/acertoMaleta/acertoReportController.ts
  - src/controllers/acertoMaleta/acertoAnalyticsController.ts
  - src/controllers/acertoMaleta/acertoFormattingUtils.ts
  - src/controllers/acertoMaleta/index.ts

- Criado arquivo de compatibilidade src/controllers/acertoMaletaController.ts que reexporta o módulo refatorado

### Impacto
- Melhora na organização e manutenibilidade do código
- Sem alteração de comportamento ou funcionalidade
- Facilita futuros desenvolvimentos e correções

## [2025-03-25] - Correção no processo de acerto de maletas
**Desenvolvedor:** Equipe Dalia Manager

### Alterações
- Não foram necessárias alterações no esquema do banco de dados.
- A correção foi implementada na lógica de manipulação de dados das tabelas existentes.

### Detalhes da Correção
1. Modificada a lógica de processamento para garantir que os itens sejam excluídos da tabela `suitcase_items` após o acerto, tanto para itens vendidos quanto para itens verificados (devolvidos ao estoque)
2. Implementada uma estratégia de remoção de registros em vez de apenas atualização de status
3. Melhorado o tratamento de erros durante as transações

### Justificativa
Esta alteração corrige um bug crítico onde os itens permaneciam na maleta após o acerto ser finalizado, causando inconsistência de dados e confusão para os usuários.

### Impacto
- Melhora na integridade dos dados do sistema
- Resolução de um problema que afetava a experiência do usuário
- Não há impacto negativo nas funcionalidades existentes
