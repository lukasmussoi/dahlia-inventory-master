
/**
 * @file Este arquivo serve como ponte para a nova estrutura modular do inventário
 * Mantém compatibilidade com o código existente que importa diretamente deste arquivo
 */

// Re-exportar tudo do novo módulo de inventário
export * from "./inventory";

// Re-exportar a classe InventoryModel para manter compatibilidade
import { InventoryModel } from "./inventory";
export { InventoryModel };
