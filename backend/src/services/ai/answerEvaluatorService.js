// backend/src/services/ai/answerEvaluatorService.js
import BaseAIService from './baseAIService.js';

class AnswerEvaluatorService extends BaseAIService {
  async evaluateAnswer(question, userAnswer, context = {}) {
    const { category = 'technical', difficulty = 'medium' } = context;
    
    // If answer is empty or too short
    if (!userAnswer || userAnswer.trim().length < 10) {
      return {
        overallScore: 0,
        scores: {
          technical: 0,
          communication: 0,
          confidence: 0,
          clarity: 0,
          relevance: 0
        },
        strengths: ['Attempted to answer'],
        weaknesses: ['Answer is too short or empty', 'Please provide a detailed response'],
        feedback: '❌ No valid answer provided. Please provide a detailed response to receive a proper evaluation.',
        idealAnswer: 'A proper answer should be at least 2-3 sentences explaining the concept.',
        improvementTips: ['Provide more detailed answers', 'Explain your thought process', 'Use examples'],
        timestamp: new Date()
      };
    }
    
    const prompt = `You are an expert technical interviewer. Evaluate this interview answer STRICTLY based on the question asked.

QUESTION: ${question}
CATEGORY: ${category}
DIFFICULTY: ${difficulty}

CANDIDATE'S ANSWER:
${userAnswer}

IMPORTANT RULES:
1. ONLY evaluate if the answer matches the question asked
2. If answer is for a different question, score 0 and mention the mismatch
3. Score based on: correctness (40%), completeness (30%), clarity (20%), examples (10%)
4. Be honest and strict - wrong answers get low scores (0-30%)
5. Partial correct answers get medium scores (40-60%)
6. Complete correct answers get high scores (70-100%)

Return ONLY JSON:
{
  "overallScore": number(0-100),
  "technicalScore": number(0-100),
  "communicationScore": number(0-100),
  "confidenceScore": number(0-100),
  "clarityScore": number(0-100),
  "relevanceScore": number(0-100),
  "strengths": [string],
  "weaknesses": [string],
  "feedback": string,
  "idealAnswer": string,
  "improvementTips": [string]
}`;

    try {
      const result = await this.callAIWithJSON(prompt, { maxTokens: 4096 });
      return {
        overallScore: result.overallScore || 0,
        scores: {
          technical: result.technicalScore || 0,
          communication: result.communicationScore || 0,
          confidence: result.confidenceScore || 0,
          clarity: result.clarityScore || 0,
          relevance: result.relevanceScore || 0
        },
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || ['Answer needs improvement'],
        feedback: result.feedback || 'Your answer needs more clarity and detail.',
        idealAnswer: result.idealAnswer || 'Provide a structured answer with examples.',
        improvementTips: result.improvementTips || ['Use STAR method', 'Add specific examples', 'Explain your thought process'],
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Evaluation error:', error);
      return this.getDefaultEvaluation(userAnswer);
    }
  }

  getDefaultEvaluation(answer) {
    const isShort = answer.length < 50;
    return {
      overallScore: isShort ? 20 : 50,
      scores: {
        technical: isShort ? 15 : 45,
        communication: isShort ? 20 : 50,
        confidence: 40,
        clarity: isShort ? 15 : 45,
        relevance: 50
      },
      strengths: ['Attempted to answer'],
      weaknesses: isShort ? ['Answer too short', 'Missing details'] : ['Needs more structure', 'Add examples'],
      feedback: isShort ? 'Please provide a more detailed answer.' : 'Good attempt! Add more specific examples.',
      idealAnswer: 'Provide a clear, structured answer with examples.',
      improvementTips: ['Use STAR method', 'Add specific examples', 'Quantify achievements'],
      timestamp: new Date()
    };
  }

  async generateFollowUp(question, answer, score) {
    // Only generate follow-up if score is between 40-80 (not too bad, not perfect)
    if (score < 40 || score > 80) {
      return { shouldAskFollowUp: false, question: null, reason: null };
    }
    
    const prompt = `Based on this answer, suggest ONE follow-up question:

QUESTION: ${question}
ANSWER: ${answer}
SCORE: ${score}/100

Return ONLY JSON:
{
  "shouldAskFollowUp": boolean,
  "question": "string",
  "reason": "string"
}`;

    try {
      const result = await this.callAIWithJSON(prompt, { maxTokens: 1024 });
      return result;
    } catch (error) {
      return { shouldAskFollowUp: false, question: null, reason: null };
    }
  }
}

export default AnswerEvaluatorService;