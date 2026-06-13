// backend/src/services/ai/baseAIService.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import GroqService from './groqService.js';

class BaseAIService {
  constructor() {
    this.useGroq = process.env.USE_GROQ === 'true' || true;
    this.useMock = false;
    
    // Initialize Groq
    this.groqService = new GroqService();
    
    // Initialize Gemini as fallback (optional)
    this.initGemini();
    
    console.log(`🤖 AI Service initialized with ${this.groqService.enabled ? 'Groq (primary)' : 'Mock mode'}`);
  }

  initGemini() {
    const apiKey = process.env.AI_API_KEY;
    if (apiKey && apiKey !== 'your-gemini-api-key-here' && apiKey !== '') {
      try {
        this.geminiClient = new GoogleGenerativeAI(apiKey);
        this.geminiModel = this.geminiClient.getGenerativeModel({ 
          model: process.env.AI_MODEL_GEMINI || 'gemini-2.0-flash' 
        });
        console.log('✅ Gemini initialized as fallback');
      } catch (error) {
        console.log('⚠️ Gemini init failed:', error.message);
      }
    }
  }

  async callAI(prompt, options = {}) {
    // Try Groq first
    if (this.groqService && this.groqService.enabled) {
      try {
        const response = await this.groqService.client.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: this.groqService.model,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 4096,
        });
        return response.choices[0].message.content;
      } catch (error) {
        console.log('Groq call failed, trying fallback...', error.message);
      }
    }
    
    // Fallback to Gemini
    if (this.geminiModel) {
      try {
        const result = await this.geminiModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxTokens || 4096,
          },
        });
        return result.response.text();
      } catch (error) {
        console.log('Gemini failed:', error.message);
      }
    }
    
    // Ultimate fallback to mock
    console.log('🎭 Using mock response');
    return this.getMockResponse(prompt);
  }

  async callAIWithJSON(prompt, options = {}) {
    const mergedOptions = { maxTokens: 1500, temperature: 0.2, ...options };
    // Modified prompt to expect array for questions
    const jsonPrompt = prompt + "\n\nIMPORTANT: Return ONLY valid JSON. For questions, return a JSON ARRAY starting with [ and ending with ]. No markdown, no explanations, no extra text.";
    
    try {
      const response = await this.callAI(jsonPrompt, mergedOptions);
      
      // Clean the response
      let cleanedResponse = response.trim();
      
      // Remove markdown code blocks
      cleanedResponse = cleanedResponse.replace(/```json\s*/g, '');
      cleanedResponse = cleanedResponse.replace(/```\s*/g, '');
      cleanedResponse = cleanedResponse.replace(/`/g, '');
      
      // Try to find JSON array first (for questions)
      let jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
      
      // If no array found, try to find JSON object
      if (!jsonMatch) {
        jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      }
      
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error('JSON parse failed, trying to fix:', parseError.message);
          // Try to fix common JSON issues
          let fixedJson = jsonMatch[0]
            .replace(/,\s*\}/g, '}')  // Remove trailing commas in objects
            .replace(/,\s*\]/g, ']')  // Remove trailing commas in arrays
            .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":') // Ensure keys are quoted
            .replace(/\n/g, ' ')       // Replace newlines with spaces
            .replace(/\s+/g, ' ')      // Replace multiple spaces with single space
            .trim();
          
          try {
            return JSON.parse(fixedJson);
          } catch {
            // If still failing, try to extract just the data
            console.error('Could not fix JSON, using default response');
            return this.getDefaultJSONResponse();
          }
        }
      }
      
      console.error('No JSON found in response');
      return this.getDefaultJSONResponse();
    } catch (error) {
      console.error('❌ JSON parse error:', error.message);
      return this.getDefaultJSONResponse();
    }
  }

  async answerGeneralQuestion(question) {
    console.log(`🤖 Answering: ${question.substring(0, 50)}...`);
    
    // Try Groq first
    if (this.groqService && this.groqService.enabled) {
      try {
        const answer = await this.groqService.answerQuestion(question);
        if (answer && !answer.includes('fallback')) {
          return answer;
        }
      } catch (error) {
        console.log('Groq failed, trying fallback...');
      }
    }
    
    // Fallback to Gemini
    if (this.geminiModel) {
      try {
        const result = await this.geminiModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: question }] }],
        });
        return result.response.text();
      } catch (error) {
        console.log('Gemini failed:', error.message);
      }
    }
    
    // Ultimate fallback
    return this.getMockAnswer(question);
  }

  getMockResponse(prompt) {
    if (prompt.toLowerCase().includes('evaluate')) {
      return JSON.stringify({
        score: 70,
        feedback: "Good attempt! Keep practicing.",
        strengths: ["Good effort"],
        improvements: ["Add more specific examples"]
      });
    }
    if (prompt.toLowerCase().includes('question')) {
      return JSON.stringify([
        {
          text: "Tell me about yourself.",
          type: "behavioral",
          difficulty: "easy",
          expectedKeywords: ["experience", "background"]
        },
        {
          text: "What are your greatest strengths?",
          type: "behavioral",
          difficulty: "easy",
          expectedKeywords: ["skills", "achievements"]
        },
        {
          text: "Describe a challenging project you worked on.",
          type: "technical",
          difficulty: "medium",
          expectedKeywords: ["problem", "solution", "outcome"]
        }
      ]);
    }
    return "I'm here to help with your interview preparation!";
  }

  getMockAnswer(question) {
    return `**Answer to: "${question}"**

Use the STAR method (Situation, Task, Action, Result) and provide specific examples from your experience.`;
  }

  getDefaultJSONResponse() {
    // Return a default array of questions (for question generation)
    return [
      {
        text: "Tell me about yourself.",
        type: "behavioral",
        difficulty: "easy",
        expectedKeywords: ["experience", "background", "career"]
      },
      {
        text: "What are your greatest strengths?",
        type: "behavioral",
        difficulty: "easy",
        expectedKeywords: ["skills", "achievements", "qualities"]
      },
      {
        text: "What are your weaknesses?",
        type: "behavioral",
        difficulty: "medium",
        expectedKeywords: ["improvement", "learning", "growth"]
      },
      {
        text: "Describe a challenging project you worked on.",
        type: "technical",
        difficulty: "medium",
        expectedKeywords: ["problem", "solution", "outcome", "learned"]
      },
      {
        text: "How do you handle conflict in a team?",
        type: "behavioral",
        difficulty: "medium",
        expectedKeywords: ["teamwork", "resolution", "communication"]
      }
    ];
  }
}

export default BaseAIService;