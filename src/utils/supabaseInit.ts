
/**
 * Utilitários para inicialização dos recursos do Supabase
 * @file Este arquivo contém funções para garantir que os recursos necessários do Supabase
 * estejam disponíveis antes do uso da aplicação
 */
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Verifica e cria buckets necessários para armazenamento de imagens no Supabase Storage
 * @returns Promise<boolean> - true se os buckets estão prontos, false caso contrário
 */
export const initializeSupabaseStorage = async (): Promise<boolean> => {
  try {
    console.log("Inicializando Supabase Storage...");
    
    // Verificar buckets existentes
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("Erro ao listar buckets:", listError);
      return false;
    }
    
    // Verificar se os buckets necessários existem
    const bucketNames = buckets.map(bucket => bucket.name);
    console.log("Buckets existentes:", bucketNames);
    
    // Array de buckets necessários para verificação
    const requiredBuckets = ['inventory_images', 'inventory_photos'];
    
    // Verificar status dos buckets
    for (const bucketName of requiredBuckets) {
      if (!bucketNames.includes(bucketName)) {
        console.log(`Bucket ${bucketName} não encontrado. Verificando se foi criado em outra sessão...`);
        
        // Tentar acessar o bucket para verificar se ele existe
        const { data, error } = await supabase.storage.from(bucketName).list();
        
        if (error && error.message.includes('The resource was not found')) {
          console.error(`Erro ao acessar bucket ${bucketName}:`, error);
          toast.error(`Não foi possível acessar o bucket ${bucketName}. Contate o administrador.`);
          return false;
        }
        
        console.log(`Bucket ${bucketName} está acessível.`);
      } else {
        console.log(`Bucket ${bucketName} encontrado.`);
        
        // Verificar se o bucket é público
        const { exists, isPublic } = await checkBucketStatus(bucketName);
        
        if (exists && !isPublic) {
          console.log(`Bucket ${bucketName} não é público. Algumas funcionalidades podem não funcionar corretamente.`);
          toast.warning(`O bucket ${bucketName} não é público. Algumas imagens podem não ser exibidas corretamente.`);
        }
      }
      
      // Verificar/criar pasta 'inventory' no bucket
      try {
        const { data: folders } = await supabase.storage.from(bucketName).list();
        
        if (!folders?.some(item => item.name === 'inventory')) {
          // Criar um arquivo temporário para simular a criação da pasta
          const tempFile = new Blob([''], { type: 'text/plain' });
          await supabase.storage.from(bucketName).upload('inventory/.folder', tempFile);
          console.log(`Pasta 'inventory' criada no bucket ${bucketName}.`);
        } else {
          console.log(`Pasta 'inventory' já existe no bucket ${bucketName}.`);
        }
      } catch (folderError) {
        console.error(`Erro ao verificar/criar pasta 'inventory' no bucket ${bucketName}:`, folderError);
      }
    }
    
    console.log("Inicialização do Supabase Storage concluída com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro ao inicializar Supabase Storage:", error);
    toast.error("Erro ao inicializar armazenamento. Algumas funcionalidades podem não funcionar corretamente.");
    return false;
  }
};

/**
 * Verifica o status de um bucket específico
 * @param bucketName Nome do bucket a ser verificado
 * @returns Promise<{exists: boolean, isPublic: boolean}> Status do bucket
 */
export const checkBucketStatus = async (bucketName: string): Promise<{exists: boolean, isPublic: boolean}> => {
  try {
    // Verificar se o bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("Erro ao listar buckets:", listError);
      return { exists: false, isPublic: false };
    }
    
    const bucket = buckets.find(b => b.name === bucketName);
    
    if (!bucket) {
      return { exists: false, isPublic: false };
    }
    
    return { exists: true, isPublic: bucket.public };
  } catch (error) {
    console.error(`Erro ao verificar status do bucket ${bucketName}:`, error);
    return { exists: false, isPublic: false };
  }
};
