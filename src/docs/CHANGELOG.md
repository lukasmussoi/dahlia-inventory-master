
# Histórico de Alterações (Changelog)

Este documento mantém um registro de todas as alterações significativas feitas no sistema, incluindo correções de bugs, novas funcionalidades e melhorias.

## [Versão 1.0.3] - 2025-03-12

### Correções
- Corrigido problema crítico que causava tela em branco nas rotas de categorias, fornecedores e etiquetas customizadas
- Adicionadas políticas de segurança (RLS) para todas as tabelas principais: fornecedores, categorias e etiquetas customizadas
- Implementado melhor mecanismo de verificação de permissões de administrador
- Melhorado o tratamento de erros e exibição de mensagens ao usuário
- Adicionados logs extensivos para auxiliar no debug de problemas de autenticação e autorização
- Garantido que queries sejam executadas somente quando o usuário tem as permissões adequadas (enabled: isAdmin)

### Melhorias
- Adicionada função de segurança aprimorada para verificação de administrador
- Implementado feedback visual durante carregamento de dados em todas as telas
- Melhorado redirecionamento de usuários sem permissões adequadas
- Código do AuthModel refatorado para melhor tratamento de erros e logging
- Adicionadas verificações duplas de autenticação para maior segurança
- Removida dependência de controle de acesso client-side, utilizando políticas RLS no banco de dados

## [Versão 1.0.2] - 2025-03-11

### Correções
- Corrigido problema crítico que causava tela em branco nas rotas de categorias, fornecedores e etiquetas customizadas
- Adicionada verificação correta de permissões de administrador em todas as rotas protegidas
- Adicionada verificação de autenticação consistente em todas as rotas
- Adicionados indicadores de carregamento nas tabelas de categorias e fornecedores
- Corrigido problema de execução das queries que impediam o carregamento de dados nas tabelas

### Melhorias
- Implementado controle mais seguro de acesso baseado em perfil de administrador
- Adicionada restrição para que queries sejam executadas apenas quando o perfil for carregado e for administrador
- Otimizado código para melhor tratamento de erros de autenticação e autorização

## [Versão 1.0.1] - 2025-03-10

### Correções
- Corrigido problema de TypeScript no componente LabelCanvas.tsx relacionado ao método set() do fabric.js
- Corrigido problema de tipagem no customLabelPdfUtils.ts para campos JSON
- Corrigido problema de acesso em rotas de etiquetas customizadas, categorias e fornecedores
- Adicionada função generatePdfFromCustomLabel e generatePpla no customLabelPdfUtils.ts para corrigir erros de importação
- Corrigido problema de chamada de método em objetos do Fabric.js usando a sintaxe correta do objeto

### Melhorias
- Implementado verificação de autenticação consistente em todas as rotas
- Garantido acesso total para administradores em todos os módulos do sistema
- Criado documento de histórico de alterações (CHANGELOG.md) para documentação de mudanças
- Adicionadas políticas de segurança (RLS) para garantir acesso adequado a tabelas importantes
- Corrigidas funções de segurança para verificar corretamente funções de usuários

## [Versão 1.0.0] - 2025-03-01

### Funcionalidades Iniciais
- Sistema de autenticação e controle de acesso baseado em funções
- Gestão de inventário e categorias
- Gerenciamento de fornecedores
- Impressão de etiquetas customizadas
- Dashboard com visão geral do sistema
