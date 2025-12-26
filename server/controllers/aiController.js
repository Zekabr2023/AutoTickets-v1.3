const axios = require('axios');

const generateResponse = async (req, res) => {
    try {
        const { prompt, history } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error('[AI] GEMINI_API_KEY not configured on server.');
            return res.status(500).json({ success: false, error: 'AI Service not configured' });
        }

        if (!prompt) {
            return res.status(400).json({ success: false, error: 'Prompt is required' });
        }

        // Construct the payload for Gemini 1.5 Flash (or Pro)
        // Using valid REST API structure
        const contents = [];

        // Add history if exists (simplified)
        if (history && Array.isArray(history)) {
            history.forEach(msg => {
                contents.push({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.message || msg.text }]
                });
            });
        }

        // Add current prompt
        contents.push({
            role: 'user',
            parts: [{ text: prompt }]
        });

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await axios.post(url, {
            contents: contents
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return res.json({
            success: true,
            data: generatedText
        });

    } catch (error) {
        console.error('[AI] Error calling Gemini:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            error: 'Failed to generate response',
            details: error.response?.data?.error?.message || error.message
        });
    }
};

module.exports = {
    generateResponse
};
