const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use environment variables for Supabase connection
// Prioritize standard names but fallback to VITE prefixes if copied from frontend
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ ERROR: Missing Supabase credentials in .env file (server/.env). system_settings will fail.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Default config structure
const defaultConfig = {
    discord: { webhookUrl: '' },
    whatsapp: { wabaId: '', phoneNumberId: '', accessToken: '' },
    email: { host: '', port: 587, secure: false, auth: { user: '', pass: '' }, from: '' },
    templates: [] // Mappings: { status: 'Resolved', templateName: '...' }
};

const getConfig = async () => {
    try {
        const { data, error } = await supabase
            .from('system_settings')
            .select('config')
            .limit(1)
            .single();

        if (error) {
            // Check if error is "Row not found" or something else
            if (error.code === 'PGRST116') { // JSON object returned when no rows found
                // Auto-initialize if empty
                console.log("⚙️ System settings not found, initializing...");
                await updateConfig(defaultConfig);
                return defaultConfig;
            }
            console.error("❌ Error reading system_settings from DB:", error);
            return defaultConfig;
        }

        return data?.config || defaultConfig;
    } catch (error) {
        console.error("❌ Exception reading system_settings:", error);
        return defaultConfig;
    }
};

const updateConfig = async (newConfig) => {
    try {
        // We need to fetch the ID (or just update the first row we find)
        // Since we want to merge, we get current config first inside the controller usually, 
        // but here updateConfig is called with the FULL new config object from frontend usually.
        // However, checking implementation: notificationController calls updateConfig(req.body).
        // The frontend sends the accumulated config.

        // Let's ensure we merge with defaults to avoid missing keys if frontend sends partial
        const finalConfig = { ...defaultConfig, ...newConfig };

        const { data: rows } = await supabase
            .from('system_settings')
            .select('id')
            .limit(1);

        if (rows && rows.length > 0) {
            const id = rows[0].id;
            const { error } = await supabase
                .from('system_settings')
                .update({
                    config: finalConfig,
                    updated_at: new Date()
                })
                .eq('id', id);

            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('system_settings')
                .insert([{ config: finalConfig }]);

            if (error) throw error;
        }

        return { success: true };
    } catch (error) {
        console.error("❌ Error writing system_settings:", error);
        return { success: false, error: error.message };
    }
};

module.exports = { getConfig, updateConfig };
