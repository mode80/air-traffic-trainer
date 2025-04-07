// Evaluation Prompt Template for Air Traffic Trainer

class EvaluationPrompt {
    /**
     * Generates the evaluation prompt for Groq API
     * 
     * @param {Object} scenario - The current scenario
     * @param {Array} conversationHistory - The conversation history
     * @param {String} userResponse - The user's response to evaluate
     * @param {Boolean} isAudio - Whether the response was from audio input
     * @param {Boolean} isEditedResponse - Whether this is an edited response
     * @returns {String} - The formatted prompt for Groq
     */
    static generatePrompt(scenario, conversationHistory, userResponse, isAudio = false, isEditedResponse = false) {
        // Build weather information for prompt
        const weatherBlock = scenario.weatherInfo && scenario.weatherInfo.trim() !== '' ? 
            `\nWeather Information:\n${scenario.weatherInfo}` : '';
        
        // Add source information
        const sourceInfo = isAudio ? 
            `\nNote: This response was provided via audio input and then transcribed.` : 
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
        
        // Create prompt with proper context for Groq to evaluate
        return `You are an FAA examiner evaluating a pilot's radio communication for a VFR scenario. Rate the following radio call and provide feedback based on standard aviation communication practices:

Scenario: ${scenario.title}
${scenario.description}${conversationContext}${weatherBlock}

Flight Info:
- Aircraft: ${scenario.aircraft}
- Tail Number: ${scenario.tailNumber}
- Airport: ${scenario.airport}${sourceInfo}${editedInfo}

Pilot's actual radio call (ONLY EVALUATE THIS SPECIFIC TRANSMISSION):
"${userResponse}"

IMPORTANT EVALUATION GUIDELINES:
1. Allow for situation-appropriate abbreviations and variations as used in real-world radio communications:
   - Aircraft type instead of full tail number when appropriate (e.g., "Cessna six niner zero" instead of "November one four six niner zero")
   - Airport name instead of identifier when commonly used (e.g., "Half Moon traffic" vs "KHAF traffic")

2. Strongly favor spelled-out aviation numeric phraseology over digits:
   - Reward proper aviation number pronunciation (e.g., "niner" for 9)
   - Prefer "three thousand five hundred" over "3,500"
   - Expect headings to be spoken as individual digits (e.g., "heading zero niner zero" not "heading ninety")
   - Expect altitudes as thousands and hundreds (e.g., "six thousand five hundred" not "six five zero zero" and not "sixty five hundred")
   - Expect frequencies to be spoken with "point" or "decimal" (e.g., "one one niner point eight")

3. Focus only on content that matters in verbal communications:
   - IGNORE capitalization, punctuation, typos, and spelling errors in the evaluation
   - COMPLETELY DISREGARD spelling errors like 'decend' vs 'descend' or 'fife' vs 'five'
   - Focus on whether the essential information is communicated
   - Consider whether the communication would be clear to ATC or other pilots
   - "November" is optional for tail numbers
   - Be lenient to the possibility that Text-to-Speech may have introduced "similar sounding words" to what the pilot actually said. 

4. Be lenient on word order when all required information is present and the meaning is clear. 

5. Conversation Continuation Guidelines: 
   - Mark the conversation as complete ONLY when the exchange has reached a natural conclusion and no further communication is expected
   - For towered airports, continue the conversation until the aircraft has landed, been handed off, or explicitly dismissed
   - For arriving aircraft, the conversation typically includes: initial contact, approach/pattern instructions, landing clearance, and taxi instructions
   - For departing aircraft, the conversation typically includes: initial contact, taxi instructions, takeoff clearance, and departure instructions/handoff
   - If further ATC response is expected in real-world operations, provide that response and set conversationComplete to false
   - Only set atcResponse to "" (empty string) AND conversationComplete to true when the scenario has truly concluded

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
