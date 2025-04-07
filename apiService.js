// API Service for Air Traffic Trainer

class ApiService {
    
    /**
     * Call Groq API to evaluate a pilot's response
     * 
     * @param {String} prompt - The evaluation prompt
     * @returns {Object} - The parsed JSON response from Groq
     * @throws {Error} - If the API call fails
     */
    static async callGroq(prompt) {
        // Get API key
        const apiKey = localStorage.getItem('groq_api_key');
        if (!apiKey) {
            throw new Error("Groq API key required. Please add your Groq API key down below.");
        }
        
        // Call Groq API
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-r1-distill-llama-70b',
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
                let parsedResponse;
                
                // First try direct JSON parsing
                try {
                    parsedResponse = JSON.parse(responseContent);
                } catch (e) {
                    console.log("Direct JSON parsing failed, attempting to extract JSON from response");
                    
                    // If direct parsing fails, try to extract JSON from the response
                    // Look for JSON-like patterns in the response
                    const jsonRegex = /\{[\s\S]*\}/;
                    const match = responseContent.match(jsonRegex);
                    
                    if (match) {
                        const jsonString = match[0];
                        console.log("Extracted potential JSON:", jsonString);
                        parsedResponse = JSON.parse(jsonString);
                    } else {
                        console.error("Failed to extract JSON from response:", responseContent);
                        throw new Error("Failed to parse evaluation response. The API returned an invalid format.");
                    }
                }
                
                // Remove commas from atcResponse field - do this once after successful parsing
                if (parsedResponse && parsedResponse.atcResponse) {
                    parsedResponse.atcResponse = parsedResponse.atcResponse.replace(/,/g, '');
                }
                return parsedResponse;
            } catch (e) {
                console.error("Failed to parse JSON response:", e);
                console.error("Raw response:", responseContent);
                throw new Error("Failed to parse evaluation response. The API returned an invalid format.");
            }
        } else {
            // Handle error response
            const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error occurred' } }));
            console.error("Groq API error:", errorData);
            
            // Handle API key errors
            if (response.status === 401) {
                localStorage.removeItem('groq_api_key');
                throw new Error("Invalid Groq API key. Please check your Groq API key in the settings.");
            } else {
                throw new Error(`Error from Groq API: ${errorData.error?.message || 'Unknown error'}`);
            }
        }
    }

    /**
     * Call Groq Whisper API to transcribe audio
     * 
     * @param {Blob} audioBlob - The audio blob to transcribe
     * @param {String} fileName - The filename for the audio file
     * @param {String} prompt - Optional prompt for context or spelling guidance
     * @returns {Object} - The transcription response from Groq API with word-level timestamps
     * @throws {Error} - If the API call fails
     */
    static async transcribeAudioWithGroq(audioBlob, fileName, prompt = '') {
        // Get API key
        const apiKey = localStorage.getItem('groq_api_key');
        if (!apiKey) {
            throw new Error("Groq API key required. Please add your Groq API key down below.");
        }
        
        // Create FormData for Groq API
        const formData = new FormData();
        formData.append('file', audioBlob, fileName);
        formData.append('model', 'whisper-large-v3-turbo');
        formData.append('language', 'en');
        
        // Request word-level timestamps in the response
        formData.append('response_format', 'verbose_json');
        formData.append('timestamp_granularities[]', 'word'); // Add this parameter to get word-level timestamps
        
        // Add aviation-specific prompt if provided
        if (prompt) {
            formData.append('prompt', prompt);
        } else {
            formData.append('prompt', 'This is a pilot radio communication in standard aviation phraseology. Preserve all spelled-out numbers exactly as spoken (e.g. "one two tree" should not be converted to "123"). Aviation communications require numbers to be spoken individually.');
        }
        
        // Call Groq API
        const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            body: formData
        });
        
        // Handle API response
        if (response.ok) {
            return await response.json();
        } else {
            // Handle error response
            const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error occurred' } }));
            console.error("Groq API error:", errorData);
            
            // Handle API key errors
            if (response.status === 401) {
                localStorage.removeItem('groq_api_key');
                throw new Error("Invalid Groq API key. Please check your Groq API key in the settings.");
            } else {
                throw new Error(`Error from Groq API: ${errorData.error?.message || 'Unknown error'}`);
            }
        }
    }
}

// Export the ApiService class
window.ApiService = ApiService;
