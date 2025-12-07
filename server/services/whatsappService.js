const axios = require('axios');
const { getConfig } = require('../utils/configManager');

const getHeaders = (token) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
});

// Cache for template metadata (language codes)
let templateCache = null;
let templateCacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getTemplates = async () => {
    const config = await getConfig();
    const { wabaId, accessToken } = config.whatsapp;

    if (!wabaId || !accessToken) return { success: false, error: "WhatsApp not configured" };

    try {
        const response = await axios.get(`https://graph.facebook.com/v21.0/${wabaId}/message_templates`, {
            headers: getHeaders(accessToken)
        });

        // Update cache
        templateCache = response.data.data || [];
        templateCacheTimestamp = Date.now();

        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.error?.message || error.message };
    }
};

const createTemplate = async (templateData) => {
    const config = await getConfig();
    const { wabaId, accessToken } = config.whatsapp;

    if (!wabaId || !accessToken) return { success: false, error: "WhatsApp not configured" };

    try {
        const response = await axios.post(`https://graph.facebook.com/v21.0/${wabaId}/message_templates`, templateData, {
            headers: getHeaders(accessToken)
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.error?.message || error.message };
    }
};

// Get the correct language code for a template
const getTemplateLanguage = async (templateName) => {
    // Refresh cache if expired or empty
    if (!templateCache || Date.now() - templateCacheTimestamp > CACHE_TTL) {
        await getTemplates();
    }

    if (templateCache) {
        const template = templateCache.find(t => t.name === templateName);
        if (template && template.language) {
            return template.language;
        }
    }

    // Default fallback: try pt_BR first (most common for Brazilian users)
    return 'pt_BR';
};

const sendMessage = async (to, templateName, variables = [], languageOverride = null, namedParams = null, buttonParams = null) => {
    const config = await getConfig();
    const { phoneNumberId, accessToken } = config.whatsapp;

    if (!phoneNumberId || !accessToken) return { success: false, error: "WhatsApp not configured" };
    if (!to) return { success: false, error: "No recipient phone number" };

    // Basic cleaning of phone number (ensure only numbers)
    const cleanPhone = to.replace(/\D/g, '');

    // Determine language: override > auto-detect > default
    const language = languageOverride || await getTemplateLanguage(templateName);

    const payload = {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'template',
        template: {
            name: templateName,
            language: { code: language },
            components: []
        }
    };

    // Support for NAMED parameters (new format: {{nome_ticket}}, {{first_name}}, etc.)
    if (namedParams && Object.keys(namedParams).length > 0) {
        payload.template.components.push({
            type: 'body',
            parameters: Object.entries(namedParams).map(([paramName, value]) => ({
                type: 'text',
                parameter_name: paramName,
                text: String(value)
            }))
        });
        console.log('[WhatsApp Service] Using NAMED body parameters:', namedParams);
    }
    // Support for POSITIONAL parameters (traditional format: {{1}}, {{2}}, etc.)
    else if (variables && variables.length > 0) {
        payload.template.components.push({
            type: 'body',
            parameters: variables.map(v => ({ type: 'text', text: String(v) }))
        });
        console.log('[WhatsApp Service] Using POSITIONAL body parameters:', variables);
    }

    // Support for BUTTON parameters (dynamic URL buttons)
    if (buttonParams && buttonParams.length > 0) {
        buttonParams.forEach((param, index) => {
            payload.template.components.push({
                type: 'button',
                sub_type: 'url',
                index: index,
                parameters: [{ type: 'text', text: String(param) }]
            });
        });
        console.log('[WhatsApp Service] Using BUTTON parameters:', buttonParams);
    }

    // Remove empty components array
    if (payload.template.components.length === 0) {
        delete payload.template.components;
    }

    console.log('[WhatsApp Service] Sending to:', cleanPhone);
    console.log('[WhatsApp Service] Template:', templateName);
    console.log('[WhatsApp Service] Language:', language);
    console.log('[WhatsApp Service] Variables:', variables);

    try {
        const response = await axios.post(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, payload, {
            headers: getHeaders(accessToken)
        });
        console.log('[WhatsApp Service] Response:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error("[WhatsApp Service] Error:", error.response?.data || error.message);

        // If language error, try fallback languages
        const errorMsg = error.response?.data?.error?.message || '';
        if (errorMsg.includes('does not exist in the translation')) {
            // Try alternate languages
            const fallbackLanguages = ['en_US', 'en', 'pt_BR', 'pt'];
            for (const fallbackLang of fallbackLanguages) {
                if (fallbackLang === language) continue; // Skip the one we already tried

                console.log(`[WhatsApp Service] Retrying with language: ${fallbackLang}`);
                payload.template.language.code = fallbackLang;

                try {
                    const retryResponse = await axios.post(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, payload, {
                        headers: getHeaders(accessToken)
                    });
                    console.log('[WhatsApp Service] Retry succeeded with language:', fallbackLang);
                    return { success: true, data: retryResponse.data };
                } catch (retryError) {
                    // Continue to next fallback
                }
            }
        }

        return { success: false, error: error.response?.data?.error?.message || error.message };
    }
};

module.exports = { getTemplates, createTemplate, sendMessage };
