// Netlify Function to translate text using Claude API
// Place this file in: netlify/functions/translate.js

exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { text, fromLang, toLang } = JSON.parse(event.body);

        // Get API key from environment variable
        const apiKey = process.env.ANTHROPIC_API_KEY;
        
        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'API key not configured' })
            };
        }

        if (!text || !fromLang || !toLang) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields: text, fromLang, toLang' })
            };
        }

        // Call Claude API
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-opus-4-6',
                max_tokens: 1024,
                messages: [
                    {
                        role: 'user',
                        content: `You are a professional interpreter. Translate the following ${fromLang} text to ${toLang}. Provide ONLY the translation, nothing else. No explanations, no quotes, just the translation.\n\n${fromLang}: ${text}`
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMsg = errorData.error?.message || 'Translation failed';
            
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: errorMsg })
            };
        }

        const data = await response.json();
        const translation = data.content[0].text.trim();

        return {
            statusCode: 200,
            body: JSON.stringify({ translation })
        };

    } catch (error) {
        console.error('Translation error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || 'Internal server error' })
        };
    }
};
