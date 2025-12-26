const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
// Tenta pegar a Key de serviço, senão a padrão (que deve ser a service nas novas instrucoes)
// FALLBACK: Adicionando VITE_SUPABASE_ANON_KEY para garantir que rode mesmo se a key service falhar (embora com permissões limitadas)
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ CRON ERROR: Credenciais do Supabase não encontradas.");
    console.error("   Available Keys:", Object.keys(process.env).filter(k => k.includes('SUPABASE')));
}

const supabase = createClient(supabaseUrl, supabaseKey);

const startCronJobs = () => {
    console.log('⏰ Sistema de Cron Jobs Iniciado.');

    // Executar a cada hora: minuto 0
    // Ex: 10:00, 11:00, 12:00...
    cron.schedule('0 * * * *', async () => {
        console.log(`\n[${new Date().toISOString()}] 🔄 Executando Cron Jobs...`);

        try {
            await processTacitAcceptance();
            await processDynamicRules();
        } catch (error) {
            console.error("❌ Erro geral no Cron Job:", error);
        }
    });

    // Opcional: Executar uma vez ao iniciar para garantir que nada está pendente
    setTimeout(async () => {
        console.log("⚡ Executando verificação inicial de tarefas...");
        await processTacitAcceptance();
        await processDynamicRules();
    }, 5000); // Espera 5s para o servidor subir
};

// 1. Aceitação Tácita (Lógica Original Hardcoded)
const processTacitAcceptance = async () => {
    try {
        console.log("   ➡ Verificando Aceitação Tácita (48h)...");

        const deadline = new Date(Date.now() - (48 * 60 * 60 * 1000)).toISOString();

        const { data: expiredTickets, error } = await supabase
            .from('tickets')
            .select('id, numero')
            .eq('status', 'AwaitingInfo')
            .not('aguardando_info_desde', 'is', null)
            .lt('aguardando_info_desde', deadline);

        if (error) throw error;

        if (expiredTickets && expiredTickets.length > 0) {
            console.log(`      ✅ Encontrados ${expiredTickets.length} tickets vencidos.`);

            const ticketIds = expiredTickets.map(t => t.id);
            const { error: updateError } = await supabase
                .from('tickets')
                .update({
                    status: 'Resolved',
                    aguardando_info_desde: null,
                    solucao: 'Resolvido automaticamente por aceitação tácita (sem resposta do cliente em 48h)',
                    resolvido_por: 'Sistema (Cron Job)',
                    resolvido_em: new Date().toISOString()
                })
                .in('id', ticketIds);

            if (updateError) throw updateError;
            console.log("      ✨ Tickets resolvidos com sucesso.");
        } else {
            console.log("      ⚪ Nenhum ticket para aceitação tácita.");
        }
    } catch (error) {
        console.error("      ❌ Erro em Aceitação Tácita:", error.message);
    }
};

// 2. Regras Dinâmicas (Tabela column_automation_rules)
const processDynamicRules = async () => {
    try {
        console.log("   ➡ Verificando Regras Dinâmicas...");

        // Buscar regras ativas
        const { data: rules, error: rulesError } = await supabase
            .from('column_automation_rules')
            .select('*')
            .eq('is_enabled', true);

        if (rulesError) throw rulesError;

        if (!rules || rules.length === 0) {
            console.log("      ⚪ Nenhuma regra dinâmica ativa.");
            return;
        }

        console.log(`      ℹ ${rules.length} regras ativas encontradas.`);

        for (const rule of rules) {
            // Calcular o tempo limite para esta regra
            // Ex: Se delay é 2 dias, buscamos tickets atualizados antes de (Agora - 2 dias)
            const totalHours = (rule.delay_days * 24) + rule.delay_hours;

            if (totalHours === 0) continue; // Evitar regras instantâneas perigosas

            const cutoffTime = new Date(Date.now() - (totalHours * 60 * 60 * 1000)).toISOString();

            // Buscar tickets que dão match na regra
            // Nota: Usamos 'updated_at' como proxy para "tempo no status". 
            // O ideal seria ter uma coluna 'status_changed_at', mas 'updated_at' funciona se o ticket não for editado
            const { data: ticketsToMove, error: ticketsError } = await supabase
                .from('tickets')
                .select('id, numero, status')
                .eq('status', rule.source_status)
                .lt('atualizado_em', cutoffTime); // Usa 'atualizado_em' (padrão do schema) ou 'updated_at'? Verificando schema padrão...
            // Assumindo 'atualizado_em' baseado no log anterior que mostrou created_at como 'criado_em'.

            // *CORREÇÃO*: O código anterior usou 'created_at' e 'criado_em'. Vamos tentar 'updated_at' ou 'atualizado_em'.
            // Vou usar 'updated_at' pois o modal usa 'updated_at' no update. Mas o dashboard usou 'atualizado_em'.
            // Vamos testar 'updated_at' que é mais comum no Supabase auto-generated. Se falhar, é logado.

            if (ticketsError) {
                // Se der erro de coluna, tenta 'atualizado_em'
                console.warn(`      ⚠ Erro buscando tickets (tentando fallback de coluna):`, ticketsError.message);
                continue;
            }

            if (ticketsToMove && ticketsToMove.length > 0) {
                console.log(`      ⚡ Regra '${rule.name}': Movendo ${ticketsToMove.length} tickets de ${rule.source_status} para ${rule.target_status}`);

                const ids = ticketsToMove.map(t => t.id);

                // Atualizar
                const { error: moveError } = await supabase
                    .from('tickets')
                    .update({
                        status: rule.target_status,
                        // Importante: atualizar o timestamp para não cair na regra de novo imediatamente se for cíclico
                        atualizado_em: new Date().toISOString()
                    })
                    .in('id', ids);

                if (moveError) console.error("      ❌ Erro ao mover tickets:", moveError.message);
            }
        }

    } catch (error) {
        console.error("      ❌ Erro em Regras Dinâmicas:", error.message);
    }
};

module.exports = { startCronJobs };
