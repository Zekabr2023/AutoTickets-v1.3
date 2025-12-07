const { getConfig, updateConfig } = require('../utils/configManager');
const discordService = require('../services/discordService');
const whatsappService = require('../services/whatsappService');
const emailService = require('../services/emailService');
const axios = require('axios');

const getConfiguration = async (req, res) => {
    const config = await getConfig();
    res.json(config);
};

const updateConfiguration = async (req, res) => {
    const result = await updateConfig(req.body);
    if (result.success) {
        res.json({ success: true, message: "Configuration updated" });
    } else {
        res.status(500).json(result);
    }
};

const notifyDiscord = async (req, res) => {
    const result = await discordService.sendNotification(req.body);
    res.json(result);
};

const listTemplates = async (req, res) => {
    const result = await whatsappService.getTemplates();
    res.json(result);
};

const createTemplate = async (req, res) => {
    const result = await whatsappService.createTemplate(req.body);
    res.json(result);
};

const sendWhatsApp = async (req, res) => {
    const { to, template, variables } = req.body;
    const result = await whatsappService.sendMessage(to, template, variables);
    res.json(result);
};

const testWhatsApp = async (req, res) => {
    const { testPhone } = req.body;
    const config = await getConfig();
    const { phoneNumberId, wabaId, accessToken } = config.whatsapp || {};

    // Validate configuration
    if (!wabaId) {
        return res.json({ success: false, error: "WABA ID não configurado" });
    }
    if (!phoneNumberId) {
        return res.json({ success: false, error: "Phone Number ID não configurado" });
    }
    if (!accessToken) {
        return res.json({ success: false, error: "Access Token não configurado" });
    }

    // Step 1: Try to list templates (validates WABA ID and Token)
    const templatesResult = await whatsappService.getTemplates();
    if (!templatesResult.success) {
        return res.json({
            success: false,
            error: `Erro ao listar templates (WABA ID ou Token inválido): ${templatesResult.error}`,
            step: 'list_templates'
        });
    }

    // Step 2: If a test phone is provided, send a real message
    if (testPhone) {
        // Use hello_world as it's a default Meta template (language: en_US)
        const cleanPhone = testPhone.replace(/\D/g, '');
        const payload = {
            messaging_product: 'whatsapp',
            to: cleanPhone,
            type: 'template',
            template: {
                name: 'hello_world',
                language: { code: 'en_US' }
            }
        };

        try {
            const response = await axios.post(
                `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
                payload,
                { headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
            );

            return res.json({
                success: true,
                message: `Mensagem de teste enviada para ${testPhone}!`,
                templates: templatesResult.data
            });
        } catch (error) {
            return res.json({
                success: false,
                error: `Erro ao enviar mensagem de teste: ${error.response?.data?.error?.message || error.message}`,
                step: 'send_message',
                templates: templatesResult.data
            });
        }
    }

    // If no test phone, just return templates (partial validation)
    res.json({
        success: true,
        message: "Configuração parcialmente válida (WABA ID e Token OK). Forneça um número para teste completo.",
        templates: templatesResult.data
    });
};

const verifyEmailConfig = async (req, res) => {
    const result = await emailService.verifyConfig();
    res.json(result);
};

// Unified Status Change Trigger
const notifyStatusChange = async (req, res) => {
    const { ticket, newStatus, clientPhone, clientEmail } = req.body;
    const config = await getConfig();
    const mappings = config.templates || [];

    // Find rules for this status
    const rules = mappings.filter(m => m.status === newStatus);
    const results = [];

    for (const rule of rules) {
        if (rule.type === 'whatsapp' && clientPhone) {
            console.log(`[Notify] Sending WhatsApp to ${clientPhone} for status ${newStatus} using template ${rule.templateName}`);

            // Get template info to check parameter format
            const templatesResult = await whatsappService.getTemplates();
            const templateInfo = templatesResult.success && templatesResult.data?.data
                ? templatesResult.data.data.find(t => t.name === rule.templateName)
                : null;

            // Check if template uses named parameters
            const bodyComponent = templateInfo?.components?.find(c => c.type === 'BODY');
            const bodyText = bodyComponent?.text || '';

            // Detect BUTTON components with dynamic URLs
            const buttonComponents = templateInfo?.components?.filter(c => c.type === 'BUTTONS') || [];
            const urlButtons = [];
            buttonComponents.forEach(bc => {
                if (bc.buttons) {
                    bc.buttons.forEach((btn, idx) => {
                        if (btn.type === 'URL' && btn.url && btn.url.includes('{{')) {
                            urlButtons.push({ index: idx, url: btn.url });
                        }
                    });
                }
            });

            // Detect named parameters like {{nome_ticket}}, {{first_name}}
            const namedParamRegex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
            const positionalParamRegex = /\{\{(\d+)\}\}/g;

            const namedMatches = [...bodyText.matchAll(namedParamRegex)];
            const positionalMatches = [...bodyText.matchAll(positionalParamRegex)];

            // Build variable mapping
            const variableMapping = {
                ticketNumero: String(ticket.numero),
                ticketTitulo: ticket.titulo || ticket.title || 'N/A',
                ticketStatus: newStatus,
                // Common named parameter variations
                nome_ticket: ticket.titulo || ticket.title || 'N/A',
                numero_ticket: String(ticket.numero),
                status_ticket: newStatus,
                ticket_number: String(ticket.numero),
                ticket_title: ticket.titulo || ticket.title || 'N/A',
                ticket_status: newStatus
            };

            // Build button params - use ticket ID for URL buttons
            const buttonParams = urlButtons.map(() => String(ticket.id || ticket.numero));
            if (buttonParams.length > 0) {
                console.log(`[Notify] Template has ${buttonParams.length} URL button(s), sending params:`, buttonParams);
            }

            let result;

            // Use NAMED parameters if template has named placeholders
            if (namedMatches.length > 0) {
                const namedParams = {};
                namedMatches.forEach(match => {
                    const paramName = match[1]; // e.g., "nome_ticket"
                    // Try to find a matching value
                    namedParams[paramName] = variableMapping[paramName] || variableMapping.ticketTitulo;
                });

                console.log(`[Notify] Detected NAMED parameters:`, namedMatches.map(m => m[1]));
                console.log(`[Notify] Sending named params:`, namedParams);

                result = await whatsappService.sendMessage(clientPhone, rule.templateName, [], null, namedParams, buttonParams);
            }
            // Use POSITIONAL parameters
            else {
                const configuredVars = rule.variables || ['ticketNumero', 'ticketStatus'];
                const variables = configuredVars.map(key => variableMapping[key] || '');

                console.log(`[Notify] Using POSITIONAL variables:`, variables);
                result = await whatsappService.sendMessage(clientPhone, rule.templateName, variables, null, null, buttonParams);

                // If failed with configured vars, try fallback strategies
                if (!result.success && variables.length > 0) {
                    console.log(`[Notify] Failed with ${variables.length} vars, retrying with fewer... Error: ${result.error}`);

                    // Try with just ticket number
                    result = await whatsappService.sendMessage(clientPhone, rule.templateName, [String(ticket.numero)], null, null, buttonParams);

                    if (!result.success) {
                        // Try with no variables (static template)
                        console.log(`[Notify] Retrying with 0 vars...`);
                        result = await whatsappService.sendMessage(clientPhone, rule.templateName, [], null, null, buttonParams);
                    }
                }
            }

            if (!result.success) {
                console.error(`[Notify] All attempts failed for template ${rule.templateName}. Final Error: ${result.error}`);
            } else {
                console.log(`[Notify] WhatsApp sent successfully!`);
            }

            results.push({ type: 'whatsapp', result });
        }

        if (rule.type === 'email' && clientEmail) {
            const subject = `Atualização do Ticket #${ticket.numero}`;
            const text = `Seu ticket mudou para: ${newStatus}`;
            const result = await emailService.sendEmail(clientEmail, subject, text, `<p>Seu ticket <b>#${ticket.numero}</b> mudou para: <b>${newStatus}</b></p>`);
            results.push({ type: 'email', result });
        }
    }

    res.json({ success: true, processed: results });
};

// Process Tacit Acceptance - Auto-resolve tickets that expired (48h without client response)
const processTacitAcceptance = async (req, res) => {
    try {
        const { createClient } = require('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return res.status(500).json({ success: false, error: 'Supabase not configured' });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Calculate deadline (48 hours ago)
        const deadline = new Date(Date.now() - (48 * 60 * 60 * 1000)).toISOString();

        // Find tickets that:
        // 1. Are in AwaitingInfo status
        // 2. Have aguardando_info_desde set
        // 3. aguardando_info_desde is older than 48 hours
        const { data: expiredTickets, error: fetchError } = await supabase
            .from('tickets')
            .select('id, numero, titulo, empresa_id')
            .eq('status', 'AwaitingInfo')
            .not('aguardando_info_desde', 'is', null)
            .lt('aguardando_info_desde', deadline);

        if (fetchError) {
            console.error('[Tacit Acceptance] Error fetching tickets:', fetchError);
            return res.status(500).json({ success: false, error: fetchError.message });
        }

        if (!expiredTickets || expiredTickets.length === 0) {
            console.log('[Tacit Acceptance] No expired tickets found');
            return res.json({ success: true, resolved: 0 });
        }

        console.log(`[Tacit Acceptance] Found ${expiredTickets.length} expired ticket(s)`);

        // Update all expired tickets to Resolved
        const ticketIds = expiredTickets.map(t => t.id);
        const { error: updateError } = await supabase
            .from('tickets')
            .update({
                status: 'Resolved',
                aguardando_info_desde: null,
                solucao: 'Resolvido automaticamente por aceitação tácita (sem resposta do cliente em 48h)',
                resolvido_por: 'Sistema (Aceitação Tácita)',
                resolvido_em: new Date().toISOString()
            })
            .in('id', ticketIds);

        if (updateError) {
            console.error('[Tacit Acceptance] Error updating tickets:', updateError);
            return res.status(500).json({ success: false, error: updateError.message });
        }

        console.log(`[Tacit Acceptance] Successfully resolved ${expiredTickets.length} ticket(s)`);

        res.json({
            success: true,
            resolved: expiredTickets.length,
            tickets: expiredTickets.map(t => ({ id: t.id, numero: t.numero, titulo: t.titulo }))
        });

    } catch (error) {
        console.error('[Tacit Acceptance] Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getConfiguration,
    updateConfiguration,
    notifyDiscord,
    listTemplates,
    createTemplate,
    sendWhatsApp,
    testWhatsApp,
    verifyEmailConfig,
    notifyStatusChange,
    processTacitAcceptance
};
