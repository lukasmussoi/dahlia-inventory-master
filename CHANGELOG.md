# CHANGELOG

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
