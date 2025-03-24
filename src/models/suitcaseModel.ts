
/**
 * Modelo de Maletas - Arquivo de Compatibilidade
 * @file Este arquivo reexporta o novo modelo refatorado para manter compatibilidade com código existente
 */

// Importar e reexportar o modelo combinado do novo diretório de maletas
import { SuitcaseModel as NewSuitcaseModel } from "./suitcase";

// Exportar a classe combinada para manter compatibilidade com código existente
export const SuitcaseModel = NewSuitcaseModel;

// Exportar a classe combinada diretamente também
export default NewSuitcaseModel;
