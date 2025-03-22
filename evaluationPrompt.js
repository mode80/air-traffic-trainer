// Evaluation Prompt Template for Air Traffic Trainer

class EvaluationPrompt {
    /**
     * Generates the evaluation prompt for OpenAI API
     * 
     * @param {Object} scenario - The current scenario object
     * @param {Array} conversationHistory - Array of conversation messages
     * @param {String} responseText - The pilot's response to evaluate
     * @param {Boolean} isAudio - Whether the response was from audio recording
     * @param {Boolean} isEditedResponse - Whether this is an edited response
     * @returns {String} - The formatted prompt for OpenAI
     */
    static generatePrompt(scenario, conversationHistory, responseText, isAudio = false, isEditedResponse = false) {
        // Build weather information for prompt
        const weatherBlock = scenario.weatherInfo && scenario.weatherInfo.trim() !== '' ? 
            `\nWeather Information:\n${scenario.weatherInfo}` : '';
        
        // Add source information
        const sourceInfo = isAudio ? 
            `\nNote: This response was provided via audio recording and then transcribed.` : 
            `\nNote: This response was typed directly by the user.`;
        
        // Add edited response information if applicable
        const editedInfo = isEditedResponse ? 
            `\nNote: This is a corrected response. Generate a new appropriate ATC response that continues the conversation forward from this point.` : 
            '';
        
        // Build conversation history for context
        let conversationContext = '';
        if (conversationHistory.length > 0) {
            conversationContext = '\nConversation history:\n';
            conversationHistory.forEach((message, index) => {
                if (index === conversationHistory.length - 1) {
                    // The last message is the current pilot message, which we'll evaluate
                    return;
                }
                conversationContext += `${message.role === 'atc' ? 'ATC' : 'Pilot'}: "${message.text}"\n`;
            });
        }
        
        // Create prompt with proper context for OpenAI to evaluate
        return `You are an FAA examiner evaluating a pilot's radio communication for a VFR scenario. Rate the following radio call and provide feedback based on standard aviation communication practices:

Scenario: ${scenario.title}
${scenario.description}${conversationContext}${weatherBlock}

Flight Info:
- Aircraft: ${scenario.aircraft}
- Tail Number: ${scenario.tailNumber}
- Airport: ${scenario.airport}${sourceInfo}${editedInfo}

Pilot's actual radio call (ONLY EVALUATE THIS SPECIFIC TRANSMISSION):
"${responseText}"

IMPORTANT EVALUATION GUIDELINES:
1. Allow for situation-appropriate abbreviations and variations as used in real-world radio communications:
   - Aircraft type instead of full tail number when appropriate (e.g., "Cessna six niner zero" instead of "November one four six niner zero")
   - Airport name instead of identifier when commonly used (e.g., "Half Moon traffic" vs "KHAF traffic")

2. Strongly favor spelled-out aviation numeric phraseology over digits:
   - Give higher scores when pilots use "one one niner point five" rather than "119.5"
   - Reward proper aviation number pronunciation (e.g., "niner" for 9, "tree" for 3, "fife" for 5)
   - Prefer "three thousand five hundred" over "3,500"
   - Expect headings to be spoken as individual digits (e.g., "heading zero niner zero" not "heading ninety")
   - Expect altitudes as thousands and hundreds (e.g., "six thousand five hundred" not "six five zero zero")
   - Expect frequencies to be spoken with "point" or "decimal" (e.g., "one one niner point eight")

3. Focus only on content that matters in verbal communications:
   - IGNORE capitalization, punctuation, and spelling or typos in the evaluation
   - Focus on whether the essential information is communicated
   - Consider whether the communication would be clear to ATC or other pilots

4. Be lenient on word order when all required information is present and the meaning is clear.

5. Conversation Completion Guidelines: 
   - Mark the conversation as complete when the exchange has reached a natural conclusion
   - If no further ATC response is needed or appropriate, set atcResponse to "" (empty string) AND set conversationComplete to true

Please evaluate ONLY THE MOST RECENT pilot radio call and provide:
1. A letter grade (A, B, C, D, F) and percentage score (0-100%) for THIS SPECIFIC TRANSMISSION
2. Specific feedback on what was correct and what needs improvement in THIS TRANSMISSION
3. An example of the proper communication for this specific transmission
4. The ATC's response to this specific transmission (if applicable)
5. Whether this communication concludes the conversation (true/false)
6. 100% is an appropriate grade when there is no opportunity for improvement

${isEditedResponse ? 'IMPORTANT: Since this is a corrected response, provide a NEW and DIFFERENT ATC response that continues the conversation forward naturally from this point. Do not repeat previous ATC responses.' : ''}

Format your response as valid JSON that can be parsed by JavaScript's JSON.parse():
{
  "grade": "A-F",
  "score": 85,
  "feedback": "Detailed feedback text here",
  "correctExample": "Exact example of correct communication",
  "atcResponse": "ATC's response to this communication (or empty string if not applicable)",
  "conversationComplete": true/false
}

Provide ONLY raw JSON in your response with no explanations, additional text, or code block formatting (no \`\`\`).`;
    }
}

// Export the EvaluationPrompt class
window.EvaluationPrompt = EvaluationPrompt;
