import { supabase } from './supabase';

export interface Empresa {
  id: string;
  nome_empresa: string;
  // senha: string; // Remocao por seguranca
  ultimo_login: string | null;
  email_notificacao?: string | null;
  whatsapp_notificacao?: string | null;
  notificacoes_ativas?: boolean;
  is_admin?: boolean;
  criado_em: string;
  atualizado_em: string;
}

export const authService = {
  /**
   * Realiza o login de uma empresa usando RPC seguro
   */
  async login(nomeEmpresa: string, senha: string): Promise<{ success: boolean; empresa?: Empresa; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('login_empresa', {
        p_nome_empresa: nomeEmpresa,
        p_senha: senha
      });

      if (error) {
        console.error('Erro no login:', error);
        return {
          success: false,
          // Melhora mensagem de erro para o usuário
          error: error.message === 'Empresa não encontrada' || error.message === 'Senha inválida'
            ? 'Usuário ou senha inválidos'
            : 'Erro ao fazer login'
        };
      }

      return { success: true, empresa: data as Empresa };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: 'Erro ao fazer login' };
    }
  },

  /**
   * Cria uma nova empresa (ou supervisor se isAdmin=true)
   */
  async criarEmpresa(nomeEmpresa: string, senha: string = 'Suporteautomabo', isAdmin: boolean = false): Promise<{ success: boolean; empresa?: Empresa; error?: string }> {
    try {
      // Inserção continua normal, pois INSERT na tabela ainda é permitido (se RLS deixar)
      // Mas o retorno deve ser explícito para não tentar ler 'senha'
      const { data: empresa, error } = await supabase
        .from('empresas')
        .insert([{ nome_empresa: nomeEmpresa, senha, is_admin: isAdmin }])
        .select('id, nome_empresa, ultimo_login, email_notificacao, whatsapp_notificacao, notificacoes_ativas, is_admin, criado_em, atualizado_em')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, empresa };
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      return { success: false, error: 'Erro ao criar empresa' };
    }
  },

  /**
   * Lista todas as empresas
   */
  async listarEmpresas(): Promise<Empresa[]> {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, nome_empresa, ultimo_login, email_notificacao, whatsapp_notificacao, notificacoes_ativas, is_admin, criado_em, atualizado_em')
        .order('nome_empresa', { ascending: true });

      if (error) {
        console.error('Erro ao listar empresas:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao listar empresas:', error);
      return [];
    }
  },
};

