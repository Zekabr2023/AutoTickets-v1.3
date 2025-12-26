import { supabase } from './supabase';

export interface IA {
  id: string;
  empresa_id: string;
  nome: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const iaService = {
  /**
   * Busca IAs de uma empresa
   */
  async buscarIAs(empresaId: string): Promise<IA[]> {
    try {
      const { data, error } = await supabase
        .from('ias')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao buscar IAs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar IAs:', error);
      return [];
    }
  },

  /**
   * Cria uma nova IA para uma empresa
   */
  async criarIA(empresaId: string, nome: string): Promise<{ success: boolean; ia?: IA; error?: string }> {
    try {
      const { data: ia, error } = await supabase
        .from('ias')
        .insert([{ empresa_id: empresaId, nome }])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, ia };
    } catch (error) {
      console.error('Erro ao criar IA:', error);
      return { success: false, error: 'Erro ao criar IA' };
    }
  },

  /**
   * Gera uma resposta usando a IA via Backend (Seguro)
   */
  async gerarResposta(prompt: string, history: any[] = []): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const response = await fetch(`${API_URL}/ia/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      return { success: true, data: result.data };
    } catch (error: any) {
      console.error('Erro ao gerar resposta IA:', error);
      return { success: false, error: error.message || 'Erro de conexão com IA' };
    }
  }
};








