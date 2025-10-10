import { supabase } from './supabase';

const BUCKET_NAME = 'ticket-images';

/**
 * Serviço para gerenciar upload e armazenamento de imagens no Supabase Storage
 */
export const imageService = {
  /**
   * Faz upload de uma imagem para o Supabase Storage
   * @param file - Arquivo de imagem
   * @param ticketNumero - Número do ticket (para organização)
   * @returns URL pública da imagem ou null em caso de erro
   */
  async uploadImage(file: File, ticketNumero: number): Promise<string | null> {
    try {
      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const fileExtension = file.name.split('.').pop();
      const fileName = `ticket-${ticketNumero}/${timestamp}-${randomString}.${fileExtension}`;

      console.log(`📤 Fazendo upload de imagem: ${fileName}`);

      // Fazer upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Erro ao fazer upload da imagem:', error);
        
        // Se o bucket não existe, tentar criar
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          console.log('🔧 Tentando criar bucket...');
          await this.createBucketIfNotExists();
          
          // Tentar upload novamente
          const { data: retryData, error: retryError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (retryError) {
            console.error('❌ Erro ao fazer upload após criar bucket:', retryError);
            return null;
          }
          
          // Obter URL pública
          const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(retryData.path);
          
          console.log('✅ Imagem enviada com sucesso (após criar bucket)!');
          return urlData.publicUrl;
        }
        
        return null;
      }

      // Obter URL pública da imagem
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      console.log('✅ Imagem enviada com sucesso!');
      return urlData.publicUrl;
    } catch (error) {
      console.error('❌ Exceção ao fazer upload:', error);
      return null;
    }
  },

  /**
   * Faz upload de múltiplas imagens
   * @param files - Array de arquivos de imagem
   * @param ticketNumero - Número do ticket
   * @returns Array de objetos { name, url }
   */
  async uploadImages(files: File[], ticketNumero: number): Promise<{ name: string; url: string }[]> {
    const uploadedImages: { name: string; url: string }[] = [];

    for (const file of files) {
      const url = await this.uploadImage(file, ticketNumero);
      if (url) {
        uploadedImages.push({
          name: file.name,
          url: url
        });
      }
    }

    return uploadedImages;
  },

  /**
   * Cria o bucket de storage se não existir
   */
  async createBucketIfNotExists(): Promise<boolean> {
    try {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('❌ Erro ao listar buckets:', listError);
        return false;
      }

      const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);
      
      if (bucketExists) {
        console.log('✅ Bucket já existe');
        return true;
      }

      console.log('🆕 Criando bucket...');
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
      });

      if (createError) {
        console.error('❌ Erro ao criar bucket:', createError);
        console.log('\n⚠️ ATENÇÃO: Crie manualmente no Supabase Dashboard:');
        console.log('Storage > New Bucket > Nome: ticket-images > Public: true');
        return false;
      }

      console.log('✅ Bucket criado com sucesso!');
      return true;
    } catch (error) {
      console.error('❌ Exceção ao criar bucket:', error);
      return false;
    }
  },

  /**
   * Deleta uma imagem do storage
   * @param imageUrl - URL pública da imagem
   */
  async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      // Extrair o caminho do arquivo da URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split(`/storage/v1/object/public/${BUCKET_NAME}/`);
      
      if (pathParts.length < 2) {
        console.error('❌ URL inválida');
        return false;
      }

      const filePath = pathParts[1];

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('❌ Erro ao deletar imagem:', error);
        return false;
      }

      console.log('✅ Imagem deletada do storage');
      return true;
    } catch (error) {
      console.error('❌ Exceção ao deletar imagem:', error);
      return false;
    }
  }
};

