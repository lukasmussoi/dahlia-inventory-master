
# CHANGELOG DATABASE

## [2025-03-29] - Adição da coluna raw_cost à tabela inventory
**Desenvolvedor:** Equipe Dalia Manager

### Alterações
```sql
-- Adicionar a coluna raw_cost à tabela inventory
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS raw_cost numeric DEFAULT 0;

-- Documentar a coluna
COMMENT ON COLUMN public.inventory.raw_cost IS 'Preço do bruto do item, antes de processamento e acabamento';
```

### Justificativa
Esta alteração foi necessária para implementar adequadamente o controle de preço do bruto dos itens de inventário, permitindo calcular corretamente os custos e margens de lucro. A coluna armazena o valor do material bruto antes de qualquer processamento ou acabamento.

### Impacto
- Melhoria no controle financeiro dos itens de estoque
- Maior precisão no cálculo de custos e margens
- Suporte adequado ao formulário de cadastro de joias que já utilizava este campo

## [2025-03-28] - Correção definitiva do processo de acerto de maletas
**Desenvolvedor:** Equipe Dalia Manager

### Alterações
- Não foram necessárias alterações no esquema do banco de dados.
- A correção foi implementada apenas na camada de aplicação, melhorando a lógica de processamento e remoção dos itens.

### Detalhes da Correção
1. Implementada uma abordagem com múltiplas verificações para garantir que todos os itens sejam removidos da maleta após o acerto.
2. Corrigida a função `returnItemToInventory` para explicitamente remover o item da maleta após devolvê-lo ao estoque.
3. Adicionada verificação final após o processamento dos itens para garantir que nenhum item permaneça na maleta.

### Justificativa
Esta correção resolve definitivamente o problema crítico onde itens permaneciam na maleta após o acerto ser finalizado, causando inconsistência de dados e confusão para os usuários.

### Impacto
- Melhora significativa na integridade dos dados
- Solução definitiva para o problema de itens que permaneciam na maleta
- Melhor experiência do usuário com resultados consistentes após o acerto
- Sem alterações no esquema do banco de dados

## [2025-03-27] - Refatoração do modelo de itens de maleta
**Desenvolvedor:** Equipe Dalia Manager

### Alterações
- Não foram necessárias alterações no esquema do banco de dados.
- A refatoração foi implementada apenas na camada de aplicação, melhorando a organização dos modelos.

### Detalhes da Refatoração
1. Separação do modelo de itens em arquivos menores e mais específicos
2. Melhor tratamento de erros e logs de depuração
3. Manutenção da compatibilidade com o código existente através de interfaces consistentes

### Justificativa
Esta refatoração melhora a manutenibilidade do código, tornando-o mais modular e facilitando futuras alterações. A organização em arquivos menores e mais focados facilita a compreensão e reduz a complexidade.

### Impacto
- Melhora na organização e estrutura do código
- Sem impacto nas funcionalidades existentes
- Sem alterações no esquema do banco de dados

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
