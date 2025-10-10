import { supabase } from './supabase';
import { Ticket, TicketStatus, UrgencyLevel } from '../types';
import { enviarWebhookTicket, enviarWebhookDeletar } from './webhooks';
import { imageService } from './imageService';

export interface TicketDB {
  id: string;
  numero: number;
  empresa_id: string;
  titulo: string;
  descricao: string;
  o_que_deveria_acontecer: string;
  ai_id: string;
  ai_name: string;
  status: string;
  urgencia: string;
  imagens?: { name: string; url: string }[];
  criado_em: string;
  atualizado_em: string;
}

export interface NovoTicketData {
  empresa_id: string;
  empresa_nome: string;
  titulo: string;
  descricao: string;
  o_que_deveria_acontecer: string;
  ai_id: string;
  ai_name: string;
  urgencia: UrgencyLevel;
  imagens?: File[];
}

// Converter ticket do banco para o formato da aplicação
const converterTicketDB = (ticketDB: TicketDB): Ticket => ({
  id: ticketDB.id,
  numero: ticketDB.numero,
  title: ticketDB.titulo,
  description: ticketDB.descricao,
  whatShouldHappen: ticketDB.o_que_deveria_acontecer,
  aiId: ticketDB.ai_id,
  aiName: ticketDB.ai_name,
  status: ticketDB.status as TicketStatus,
  createdAt: ticketDB.criado_em,
  attachments: ticketDB.imagens || [], // Carregar imagens do banco
  urgency: ticketDB.urgencia as UrgencyLevel,
});

export const ticketService = {
  /**
   * Busca todos os tickets de uma empresa
   */
  async buscarTickets(empresaId: string): Promise<Ticket[]> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('Erro ao buscar tickets:', error);
        return [];
      }

      return (data || []).map(converterTicketDB);
    } catch (error) {
      console.error('Erro ao buscar tickets:', error);
      return [];
    }
  },

  /**
   * Busca ticket por número
   */
  async buscarTicketPorNumero(empresaId: string, numero: number): Promise<Ticket | null> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('numero', numero)
        .single();

      if (error || !data) {
        return null;
      }

      return converterTicketDB(data);
    } catch (error) {
      console.error('Erro ao buscar ticket por número:', error);
      return null;
    }
  },

  /**
   * Busca tickets por status
   */
  async buscarTicketsPorStatus(empresaId: string, status: TicketStatus): Promise<Ticket[]> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('status', status)
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('Erro ao buscar tickets por status:', error);
        return [];
      }

      return (data || []).map(converterTicketDB);
    } catch (error) {
      console.error('Erro ao buscar tickets por status:', error);
      return [];
    }
  },

  /**
   * Cria um novo ticket
   */
  async criarTicket(novoTicket: NovoTicketData): Promise<{ success: boolean; ticket?: Ticket; error?: string }> {
    try {
      console.log('📝 Criando ticket...');
      
      // Primeiro, inserir o ticket para obter o número
      const { data: ticketDB, error } = await supabase
        .from('tickets')
        .insert([{
          empresa_id: novoTicket.empresa_id,
          nome_cliente: novoTicket.empresa_nome,
          titulo: novoTicket.titulo,
          descricao: novoTicket.descricao,
          o_que_deveria_acontecer: novoTicket.o_que_deveria_acontecer,
          ai_id: novoTicket.ai_id,
          ai_name: novoTicket.ai_name,
          urgencia: novoTicket.urgencia,
          status: TicketStatus.Pending,
          imagens: [], // Inicialmente vazio
        }])
        .select()
        .single();

      if (error || !ticketDB) {
        console.error('❌ Erro ao criar ticket:', error);
        return { success: false, error: 'Erro ao criar ticket' };
      }

      console.log(`✅ Ticket #${String(ticketDB.numero).padStart(4, '0')} criado!`);

      // Se há imagens, fazer upload e atualizar o ticket
      let imagensUpload: { name: string; url: string }[] = [];
      
      if (novoTicket.imagens && novoTicket.imagens.length > 0) {
        console.log(`📸 Fazendo upload de ${novoTicket.imagens.length} imagem(ns)...`);
        
        imagensUpload = await imageService.uploadImages(novoTicket.imagens, ticketDB.numero);
        
        console.log(`✅ ${imagensUpload.length} imagem(ns) enviada(s) com sucesso!`);

        // Atualizar o ticket com as URLs das imagens
        if (imagensUpload.length > 0) {
          const { error: updateError } = await supabase
            .from('tickets')
            .update({ imagens: imagensUpload })
            .eq('id', ticketDB.id);

          if (updateError) {
            console.error('⚠️ Erro ao atualizar URLs das imagens no ticket:', updateError);
          } else {
            console.log('✅ URLs das imagens salvas no banco!');
            ticketDB.imagens = imagensUpload;
          }
        }
      }

      // Enviar webhook para n8n (não bloqueante)
      enviarWebhookTicket({
        empresa_nome: novoTicket.empresa_nome,
        ticket_numero: ticketDB.numero,
        titulo: novoTicket.titulo,
        descricao: novoTicket.descricao,
        o_que_deveria_acontecer: novoTicket.o_que_deveria_acontecer,
        ai_name: novoTicket.ai_name,
        urgencia: novoTicket.urgencia,
        imagens: novoTicket.imagens,
        ticket_id: ticketDB.id,
      }).catch(err => console.error('Erro ao enviar webhook:', err));

      return { success: true, ticket: converterTicketDB(ticketDB) };
    } catch (error) {
      console.error('❌ Erro ao criar ticket:', error);
      return { success: false, error: 'Erro ao criar ticket' };
    }
  },

  /**
   * Atualiza o status de um ticket
   */
  async atualizarStatusTicket(ticketId: string, novoStatus: TicketStatus): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: novoStatus })
        .eq('id', ticketId);

      if (error) {
        console.error('Erro ao atualizar status do ticket:', error);
        return { success: false, error: 'Erro ao atualizar status' };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar status do ticket:', error);
      return { success: false, error: 'Erro ao atualizar status' };
    }
  },

  /**
   * Deleta um ticket permanentemente
   * ATENÇÃO: Exclusão otimista com delay de 15 segundos no banco
   */
  async deletarTicket(ticketId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[ticketService] 🗑️ Iniciando processo de deleção (otimista)');
      console.log('[ticketService] Ticket ID:', ticketId);
      
      // Buscar número do ticket ANTES de deletar (para enviar no webhook)
      const { data: ticketParaDeletar, error: errorBusca } = await supabase
        .from('tickets')
        .select('numero')
        .eq('id', ticketId)
        .single();

      if (errorBusca || !ticketParaDeletar) {
        console.error('[ticketService] ❌ Ticket não encontrado:', errorBusca);
        return { success: false, error: 'Ticket não encontrado' };
      }

      const ticketNumero = ticketParaDeletar.numero;
      console.log('[ticketService] Número do ticket:', `#${String(ticketNumero).padStart(4, '0')}`);

      // Enviar webhook IMEDIATAMENTE (para apagar do Trello)
      console.log('[ticketService] 📤 Enviando webhook de deleção...');
      enviarWebhookDeletar(ticketNumero).catch(err => 
        console.error('Erro ao enviar webhook de deleção:', err)
      );

      // Agendar deleção do banco para daqui a 15 segundos
      console.log('[ticketService] ⏱️ Agendando deleção do banco em 15 segundos...');
      console.log('[ticketService] ✅ Cliente vê exclusão instantânea (UI atualiza agora)');
      
      setTimeout(async () => {
        console.log('[ticketService] 🗄️ Executando deleção do banco (após 15s)...');
        
        const { error: deleteError } = await supabase
          .from('tickets')
          .delete()
          .eq('id', ticketId);

        if (deleteError) {
          console.error('[ticketService] ❌ Erro ao deletar do banco:', deleteError);
        } else {
          console.log('[ticketService] ✅ Ticket removido permanentemente do banco!');
        }
      }, 15000); // 15 segundos

      return { success: true };
    } catch (error) {
      console.error('[ticketService] ❌ Exceção ao deletar ticket:', error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * Inscreve-se para receber atualizações em tempo real dos tickets
   */
  inscreverAtualizacoes(empresaId: string, callback: (payload: any) => void) {
    const subscription = supabase
      .channel(`tickets-${empresaId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `empresa_id=eq.${empresaId}`,
        },
        callback
      )
      .subscribe();

    return subscription;
  },
};

