
# Histórico de Alterações (Changelog)

Este documento mantém um registro de todas as alterações significativas feitas no sistema, incluindo correções de bugs, novas funcionalidades e melhorias.

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
