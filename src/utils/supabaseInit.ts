
/**
 * Utilitário para inicialização de recursos do Supabase
 * Este arquivo contém funções para inicializar os buckets de armazenamento
 * do Supabase e verificar se estão configurados corretamente.
 * 
 * Relacionamentos:
 * - Utilizado pelo App.tsx durante a inicialização da aplicação
 * - Depende da conexão supabase definida em integrations/supabase/client
 */
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Verifica o status de um bucket do Supabase Storage
 * @param bucketName Nome do bucket a ser verificado
 * @returns Objeto com informações do status do bucket
 */
export const checkBucketStatus = async (bucketName: string) => {
  try {
    // Verificar se o bucket existe
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error(`Erro ao verificar status do bucket ${bucketName}:`, error);
      return { exists: false, isPublic: false, error: error.message };
    }
    
    // Verificar se o bucket está na lista
    const bucket = buckets.find(b => b.name === bucketName);
    const exists = !!bucket;
    
    // Verificar se o bucket é público
    const isPublic = exists && bucket.public;
    
    return { exists, isPublic };
  } catch (error) {
    console.error(`Erro ao verificar status do bucket ${bucketName}:`, error);
    return { exists: false, isPublic: false, error: String(error) };
  }
};

/**
 * Inicializa os buckets de armazenamento do Supabase
 * Verifica se os buckets necessários existem e cria-os se necessário
 * Também cria a pasta 'inventory' em cada bucket
 * 
 * @returns Promise<boolean> indicando se a inicialização foi bem-sucedida
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
        console.log(`Bucket ${bucketName} não encontrado. Tentando criar...`);
        
        // Tentar criar o bucket se não existir
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024 // 5MB
        });
        
        if (createError) {
          console.error(`Erro ao criar bucket ${bucketName}:`, createError);
          return false;
        }
        
        console.log(`Bucket ${bucketName} criado com sucesso.`);
      } else {
        console.log(`Bucket ${bucketName} encontrado.`);
        
        // Verificar se o bucket é público
        const { exists, isPublic } = await checkBucketStatus(bucketName);
        
        if (exists && !isPublic) {
          console.log(`Bucket ${bucketName} não é público. Algumas funcionalidades podem não funcionar corretamente.`);
        }
      }
      
      // Criar pasta 'inventory' no bucket se não existir
      try {
        const { data: folders } = await supabase.storage.from(bucketName).list();
        
        if (!folders?.some(item => item.name === 'inventory' && item.metadata?.mimetype === 'folder')) {
          // Criar um arquivo temporário para simular a criação da pasta
          const tempFile = new Blob([''], { type: 'text/plain' });
          await supabase.storage.from(bucketName).upload('inventory/.folder', tempFile);
          console.log(`Pasta 'inventory' criada no bucket ${bucketName}.`);
        }
      } catch (folderError) {
        console.error(`Erro ao verificar/criar pasta 'inventory' no bucket ${bucketName}:`, folderError);
      }
    }
    
    console.log("Inicialização do Supabase Storage concluída com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro ao inicializar Supabase Storage:", error);
    return false;
  }
};
