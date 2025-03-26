
/**
 * Controlador de Acertos de Maleta - Arquivo de Compatibilidade
 * @file Este arquivo reexporta a implementação refatorada do controlador de acertos
 * para manter compatibilidade com o código existente.
 */

// Importar e reexportar a implementação refatorada
import { AcertoMaletaController, acertoMaletaController } from './acertoMaleta';

// Exportar para manter compatibilidade com código existente
export { acertoMaletaController, AcertoMaletaController };

// Export default para casos onde é importado via import default
export default AcertoMaletaController;
