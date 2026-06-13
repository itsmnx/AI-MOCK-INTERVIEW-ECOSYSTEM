// backend/src/config/aiConfig.js
export const aiConfig = {
  provider: process.env.AI_PROVIDER || 'gemini',
  model: process.env.AI_MODEL || 'gemini-1.5-flash',
  apiKey: process.env.AI_API_KEY,
  maxTokens: 4096,
  temperature: 0.7,

  // Evaluation specific
  evaluationTemperature: 0.3,
  evaluationMaxTokens: 1500,

  // Interview specific
  interviewTemperature: 0.8,

  // Follow-up specific  
  followUpTemperature: 0.9,

  // Rate limiting
  maxRequestsPerMinute: 60,

  // Timeouts
  timeout: 30000
};