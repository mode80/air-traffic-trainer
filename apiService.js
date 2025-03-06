// API Service for Air Traffic Trainer

class ApiService {
    /**
     * Call OpenAI API to evaluate a pilot's response
     * 
     * @param {String} prompt - The evaluation prompt
     * @returns {Object} - The parsed JSON response from OpenAI
     * @throws {Error} - If the API call fails
     */
    static async callOpenAI(prompt) {
        // Get API key
        const apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            throw new Error("OpenAI API key required. Please add your API key in the settings section below.");
        }
        
        // Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an FAA examiner evaluating a pilot\'s radio communication for a VFR scenario.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7
            })
        });
        
        // Handle API response
        if (response.ok) {
            const data = await response.json();
            const responseContent = data.choices[0].message.content.trim();
            
            try {
                // Parse the JSON response
                return JSON.parse(responseContent);
            } catch (e) {
                console.error("Failed to parse JSON response:", e);
                throw new Error("Failed to parse evaluation response. The API returned an invalid format.");
            }
        } else {
            // Handle error response
            const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error occurred' } }));
            console.error("OpenAI API error:", errorData);
            
            // Handle API key errors
            if (response.status === 401) {
                localStorage.removeItem('openai_api_key');
                throw new Error("Invalid API key. Please check your OpenAI API key in the settings.");
            } else {
                throw new Error(`Error from OpenAI API: ${errorData.error?.message || 'Unknown error'}`);
            }
        }
    }
}

// Export the ApiService class
window.ApiService = ApiService;
