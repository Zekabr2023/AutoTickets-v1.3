import { supabase } from './supabase';

export interface ConfiguracaoSistema {
  id: string;
  chave: string;
  valor: string;
  descricao?: string;
  criado_em: string;
  atualizado_em: string;
}

export const configService = {
  /**
   * Busca uma configuração por chave
   */
  async buscarConfiguracao(chave: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .select('valor')
        .eq('chave', chave)
        .single();

      if (error || !data) {
        return null;
      }

      return data.valor;
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
      return null;
    }
  },

  /**
   * Atualiza uma configuração
   */
  async atualizarConfiguracao(chave: string, valor: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('configuracoes_sistema')
        .upsert({
          chave,
          valor,
        });

      if (error) {
        console.error('Erro ao atualizar configuração:', error);
        return { success: false, error: 'Erro ao atualizar configuração' };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      return { success: false, error: 'Erro ao atualizar configuração' };
    }
  },

  /**
   * Busca todos os domínios permitidos para iframe
   */
  async buscarDominiosIframe(): Promise<string[]> {
    try {
      const valor = await this.buscarConfiguracao('iframe_domains');
      if (!valor) return [];
      
      return JSON.parse(valor);
    } catch (error) {
      console.error('Erro ao buscar domínios iframe:', error);
      return [];
    }
  },

  /**
   * Atualiza os domínios permitidos para iframe
   */
  async atualizarDominiosIframe(dominios: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const valor = JSON.stringify(dominios);
      return await this.atualizarConfiguracao('iframe_domains', valor);
    } catch (error) {
      console.error('Erro ao atualizar domínios iframe:', error);
      return { success: false, error: 'Erro ao atualizar domínios iframe' };
    }
  },

  /**
   * Verifica se um domínio está permitido para iframe
   */
  async verificarDominioPermitido(dominio: string): Promise<boolean> {
    try {
      const dominiosPermitidos = await this.buscarDominiosIframe();
      return dominiosPermitidos.includes(dominio);
    } catch (error) {
      console.error('Erro ao verificar domínio permitido:', error);
      return false;
    }
  },

  /**
   * Busca todas as configurações
   */
  async buscarTodasConfiguracoes(): Promise<ConfiguracaoSistema[]> {
    try {
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .select('*')
        .order('chave');

      if (error) {
        console.error('Erro ao buscar configurações:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      return [];
    }
  },
};
