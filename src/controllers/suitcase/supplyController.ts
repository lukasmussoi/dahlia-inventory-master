
/**
 * Controlador de Abastecimento de Maletas
 * @file Este arquivo reexporta o controlador modularizado de abastecimento de maletas
 * @relacionamento Módulo de fachada que unifica o acesso às operações de abastecimento
 */
import { SuitcaseSupplyController } from "./supply/suitcaseSupplyController";

// Reexportar para manter compatibilidade com código existente
export { SuitcaseSupplyController };

// Adicionalmente, criar um alias para a classe para simplificar importações
const SupplyController = SuitcaseSupplyController;
export default SupplyController;
