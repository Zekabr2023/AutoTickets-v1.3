const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n-cbnet.automabo.com.br/webhook/Tickets';
const WEBHOOK_DELETE_URL = 'https://n8n-cbnet.automabo.com.br/webhook/apagartrello';

interface WebhookTicketData {
  empresa_nome: string;
  titulo: string;
  descricao: string;
  o_que_deveria_acontecer: string;
  ai_name: string;
  urgencia: string;
  imagens?: File[];
  ticket_id?: string;
  ticket_numero?: number;
}

export const enviarWebhookTicket = async (data: WebhookTicketData): Promise<void> => {
  try {
    // Preparar dados do ticket (sem imagens)
    const ticketData = {
      empresa_nome: data.empresa_nome,
      ticket_numero: data.ticket_numero || 0,
      titulo: data.titulo,
      descricao: data.descricao,
      o_que_deveria_acontecer: data.o_que_deveria_acontecer,
      ai_name: data.ai_name,
      urgencia: data.urgencia,
      ticket_id: data.ticket_id || '',
      total_imagens: data.imagens?.length || 0,
    };

    const formData = new FormData();
    
    // Adicionar dados do ticket como JSON também (para facilitar leitura no n8n)
    formData.append('ticket_data', JSON.stringify(ticketData));
    
    // Adicionar cada campo individualmente também
    formData.append('empresa_nome', data.empresa_nome);
    formData.append('ticket_numero', String(data.ticket_numero || 0));
    formData.append('titulo', data.titulo);
    formData.append('descricao', data.descricao);
    formData.append('o_que_deveria_acontecer', data.o_que_deveria_acontecer);
    formData.append('ai_name', data.ai_name);
    formData.append('urgencia', data.urgencia);
    
    if (data.ticket_id) {
      formData.append('ticket_id', data.ticket_id);
    }
    
    // Adicionar imagens se existirem
    if (data.imagens && data.imagens.length > 0) {
      data.imagens.forEach((imagem, index) => {
        formData.append(`imagem_${index}`, imagem, imagem.name);
        formData.append(`imagem_${index}_nome`, imagem.name);
      });
      formData.append('total_imagens', data.imagens.length.toString());
    } else {
      formData.append('total_imagens', '0');
    }
    
    // Log detalhado
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 ENVIANDO WEBHOOK');
    console.log('URL:', WEBHOOK_URL);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 DADOS DO TICKET:');
    console.log('  • Empresa:', data.empresa_nome);
    console.log('  • Número:', `#${String(data.ticket_numero || 0).padStart(4, '0')}`);
    console.log('  • Título:', data.titulo);
    console.log('  • Descrição:', data.descricao.substring(0, 50) + '...');
    console.log('  • O que deveria:', data.o_que_deveria_acontecer.substring(0, 50) + '...');
    console.log('  • IA:', data.ai_name);
    console.log('  • Urgência:', data.urgencia);
    console.log('  • Ticket ID:', data.ticket_id);
    console.log('  • Total Imagens:', data.imagens?.length || 0);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Log do FormData para debug
    console.log('📦 CAMPOS NO FORMDATA:');
    for (const pair of formData.entries()) {
      if (pair[1] instanceof File) {
        console.log(`  • ${pair[0]}: [Arquivo: ${pair[1].name}]`);
      } else {
        console.log(`  • ${pair[0]}: ${String(pair[1]).substring(0, 50)}`);
      }
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Enviar webhook
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      console.error('❌ ERRO AO ENVIAR WEBHOOK');
      console.error('Status:', response.status);
      console.error('Status Text:', response.statusText);
      const errorText = await response.text();
      console.error('Resposta do servidor:', errorText);
      throw new Error(`Erro ao enviar webhook: ${response.statusText}`);
    }
    
    const responseText = await response.text();
    console.log('✅ WEBHOOK ENVIADO COM SUCESSO!');
    console.log('Resposta do servidor:', responseText);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('Erro ao enviar webhook:', error);
    // Não lançar erro para não bloquear o fluxo do usuário
  }
};

/**
 * Envia webhook para apagar card no Trello quando ticket é deletado
 */
export const enviarWebhookDeletar = async (ticketNumero: number): Promise<void> => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🗑️ ENVIANDO WEBHOOK DE DELEÇÃO');
    console.log('URL:', WEBHOOK_DELETE_URL);
    console.log('Número do Ticket:', `#${String(ticketNumero).padStart(4, '0')}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const response = await fetch(WEBHOOK_DELETE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticket_numero: ticketNumero,
      }),
    });

    if (!response.ok) {
      console.error('❌ ERRO AO ENVIAR WEBHOOK DE DELEÇÃO');
      console.error('Status:', response.status);
      console.error('Status Text:', response.statusText);
      const errorText = await response.text();
      console.error('Resposta do servidor:', errorText);
      throw new Error(`Erro ao enviar webhook de deleção: ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log('✅ WEBHOOK DE DELEÇÃO ENVIADO COM SUCESSO!');
    console.log('Resposta do servidor:', responseText);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('Erro ao enviar webhook de deleção:', error);
    // Não lançar erro para não bloquear o fluxo do usuário
  }
};

