
# CHANGELOG DATABASE

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
