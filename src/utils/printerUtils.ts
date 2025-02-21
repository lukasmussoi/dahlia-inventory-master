
/**
 * Utilitários para geração de comandos PPLA para impressora Argox OS-214 Plus
 */

// Configurações padrão para etiquetas
const LABEL_WIDTH = 50; // mm
const LABEL_HEIGHT = 25; // mm

/**
 * Gera o comando PPLA para imprimir uma etiqueta
 * @param item Item do inventário
 * @returns string com comandos PPLA
 */
export const generatePPLACommands = (item: {
  id: string;
  name: string;
  sku: string;
}) => {
  // Início do comando PPLA
  let command = "Q50,24\n"; // Define tamanho da etiqueta
  command += "q400\n"; // Define velocidade de impressão
  command += "D8\n"; // Define densidade de impressão
  command += "ZT\n"; // Limpa buffer

  // Posiciona e imprime o nome do item
  command += `A50,20,0,3,1,1,N,"${item.name}"\n`;

  // Gera e posiciona o código de barras Code 128
  command += `B50,50,0,1,2,2,80,B,"${item.sku}"\n`;

  // Posiciona e imprime o SKU em texto
  command += `A50,140,0,3,1,1,N,"${item.sku}"\n`;

  // Finaliza o comando
  command += "E\n"; // Fim do comando

  return command;
};

/**
 * Envia comandos para a impressora via Web Serial API
 * @param commands Comandos PPLA a serem enviados
 */
export const sendToPrinter = async (commands: string): Promise<void> => {
  try {
    // Solicita acesso à porta serial
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });

    // Converte os comandos em bytes
    const encoder = new TextEncoder();
    const data = encoder.encode(commands);

    // Cria um WritableStream para enviar os dados
    const writer = port.writable.getWriter();

    // Envia os dados
    await writer.write(data);

    // Fecha o writer
    writer.releaseLock();
    await port.close();
  } catch (error) {
    console.error("Erro ao enviar para impressora:", error);
    throw new Error("Não foi possível conectar à impressora. Verifique se ela está ligada e conectada.");
  }
};
