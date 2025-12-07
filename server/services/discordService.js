const axios = require('axios');
const { getConfig } = require('../utils/configManager');

// Replace template variables with actual values
const replaceVariables = (template, data) => {
    if (!template) return '';
    return template
        .replace(/\{\{numero\}\}/g, String(data.numero || '').padStart(4, '0'))
        .replace(/\{\{titulo\}\}/g, data.titulo || 'N/A')
        .replace(/\{\{descricao\}\}/g, data.descricao || 'Sem descrição')
        .replace(/\{\{empresa\}\}/g, data.empresa || 'N/A')
        .replace(/\{\{urgencia\}\}/g, data.urgencia || 'Normal')
        .replace(/\{\{ia\}\}/g, data.ai_name || 'N/A')
        .replace(/\{\{link\}\}/g, data.ticketUrl || '');
};

const sendNotification = async (ticketData) => {
    const config = await getConfig();
    const webhookUrl = config.discord?.webhookUrl;

    if (!webhookUrl) {
        console.log("[Discord] Webhook URL not configured.");
        return { success: false, error: "Discord Webhook não configurado" };
    }

    const { ticket, empresa, frontendUrl } = ticketData;

    // Deep Link to ticket - Use passed URL or fallback
    const baseUrl = frontendUrl || process.env.FRONTEND_URL || 'http://localhost:5173';
    const ticketUrl = `${baseUrl}/?ticketId=${ticket.id}`;

    // Prepare data for variable replacement
    const templateData = {
        numero: ticket.numero,
        titulo: ticket.titulo,
        descricao: ticket.descricao,
        empresa: empresa,
        urgencia: ticket.urgencia,
        ai_name: ticket.ai_name,
        ticketUrl: ticketUrl
    };

    // Get custom templates or use defaults
    const embedTitle = config.discord?.embedTitle || '🎫 Novo Ticket #{{numero}}';
    const embedDescription = config.discord?.embedDescription || '**{{titulo}}**\n\n{{descricao}}';

    // Replace variables
    const finalTitle = replaceVariables(embedTitle, templateData);
    const finalDescription = replaceVariables(embedDescription, templateData);

    // Urgency color mapping
    const urgencyColors = {
        'Baixa': 3066993,    // Green
        'Média': 16776960,   // Yellow
        'Alta': 15158332,    // Orange
        'Crítica': 15548997  // Red
    };
    const color = urgencyColors[ticket.urgencia] || 5814783; // Default blue

    // Urgency emoji
    const urgencyEmoji = {
        'Baixa': '🟢',
        'Média': '🟡',
        'Alta': '🟠',
        'Crítica': '🔴'
    };

    const embed = {
        title: finalTitle,
        description: finalDescription,
        color: color,
        fields: [
            {
                name: "👤 Cliente",
                value: empresa || "Não identificado",
                inline: true
            },
            {
                name: "🤖 IA",
                value: ticket.ai_name || "N/A",
                inline: true
            },
            {
                name: `${urgencyEmoji[ticket.urgencia] || '⚪'} Urgência`,
                value: ticket.urgencia || "Normal",
                inline: true
            },
        ],
        footer: {
            text: `AutoTickets • Status: Pendente`
        },
        timestamp: new Date().toISOString()
    };

    // Add link button
    const components = [
        {
            type: 1, // Action Row
            components: [
                {
                    type: 2, // Button
                    style: 5, // Link
                    label: "📋 Abrir Ticket",
                    url: ticketUrl
                }
            ]
        }
    ];

    console.log(`[Discord] Sending notification for ticket #${ticket.numero}`);
    console.log(`[Discord] Title: ${finalTitle}`);
    console.log(`[Discord] Link: ${ticketUrl}`);

    try {
        await axios.post(webhookUrl, {
            embeds: [embed],
            components: components
        });
        console.log(`[Discord] Notification sent successfully!`);
        return { success: true };
    } catch (error) {
        console.error("[Discord] Webhook Error:", error.response?.data || error.message);
        return { success: false, error: error.message };
    }
};

module.exports = { sendNotification };
