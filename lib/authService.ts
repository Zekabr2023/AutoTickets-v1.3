import { supabase } from './supabase';

export interface Empresa {
  id: string;
  nome_empresa: string;
  senha: string;
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
   * Realiza o login de uma empresa
   */
  async login(nomeEmpresa: string, senha: string): Promise<{ success: boolean; empresa?: Empresa; error?: string }> {
    try {
      // Buscar empresa pelo nome
      const { data: empresa, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('nome_empresa', nomeEmpresa)
        .single();

      if (error || !empresa) {
        return { success: false, error: 'Empresa não encontrada' };
      }

      // Verificar senha
      if (empresa.senha !== senha) {
        return { success: false, error: 'Senha inválida' };
      }

      // Atualizar último login
      const { error: updateError } = await supabase
        .from('empresas')
        .update({ ultimo_login: new Date().toISOString() })
        .eq('id', empresa.id);

      if (updateError) {
        console.error('Erro ao atualizar último login:', updateError);
      }

      return { success: true, empresa };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: 'Erro ao fazer login' };
    }
  },

  /**
   * Cria uma nova empresa
   */
  async criarEmpresa(nomeEmpresa: string, senha: string = 'Suporteautomabo'): Promise<{ success: boolean; empresa?: Empresa; error?: string }> {
    try {
      const { data: empresa, error } = await supabase
        .from('empresas')
        .insert([{ nome_empresa: nomeEmpresa, senha }])
        .select()
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
        .select('*')
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

