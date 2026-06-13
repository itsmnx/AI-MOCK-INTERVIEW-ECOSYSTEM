// backend/src/services/ai/groqService.js
import Groq from 'groq-sdk';

class GroqService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    
    if (!this.apiKey) {
      throw new Error('❌ GROQ_API_KEY not found. Please set it in .env');
    }
    
    this.client = new Groq({
      apiKey: this.apiKey,
    });
    this.enabled = true;
    console.log(`✅ Groq initialized with model: ${this.model}`);
  }

  async answerQuestion(question) {
    const response = await this.client.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: 'You are an AI interview preparation assistant. Answer the following question in a helpful, detailed, and informative manner. Use examples where helpful. Keep the tone professional and encouraging.' 
        },
        { role: 'user', content: question }
      ],
      model: this.model,
      temperature: 0.7,
      max_tokens: 1024,
    });

    return response.choices[0].message.content;
  }

  async evaluateAnswer(question, answer) {
    const response = await this.client.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: `You are an expert technical interviewer. Evaluate this interview answer. Return ONLY valid JSON with this structure:
{
  "score": number(0-100),
  "feedback": "string (2-3 sentences)",
  "strengths": ["string"],
  "improvements": ["string"]
}`
        },
        { 
          role: 'user', 
          content: `QUESTION: ${question}\n\nCANDIDATE'S ANSWER:\n${answer}` 
        }
      ],
      model: this.model,
      temperature: 0.3,
      max_tokens: 512,
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Invalid JSON response');
  }
}

export default GroqService;