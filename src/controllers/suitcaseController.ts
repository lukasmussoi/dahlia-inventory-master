
/**
 * Controlador de Maletas - Arquivo de Compatibilidade
 * @file Este arquivo reexporta o novo controlador refatorado para manter compatibilidade com código existente
 */

// Importar e reexportar o controlador combinado do novo diretório de maletas
import { CombinedSuitcaseController } from "./suitcase";

// Exportar a classe combinada como SuitcaseController para manter compatibilidade
export const SuitcaseController = CombinedSuitcaseController;

