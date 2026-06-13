// backend/src/services/ai/chatInterviewService.js
import BaseAIService from './baseAIService.js';

class ChatInterviewService extends BaseAIService {
  async evaluateAndNext(question, answer, category, difficulty, conversationHistory) {
    console.log('📝 ChatInterviewService called:', { 
      question: question?.substring(0, 50), 
      answerProvided: !!answer,
      category 
    });
    
    // Case 1: General question (no answer)
    if (!answer || answer.trim() === '') {
      console.log('📝 Processing as GENERAL QUESTION');
      const generalAnswer = await this.answerGeneralQuestion(question);
      
      return {
        evaluation: {
          score: 0,
          feedback: generalAnswer,
          strengths: [],
          improvements: []
        },
        nextQuestion: null
      };
    }
    
    // Case 2: Answer evaluation
    console.log('📝 Processing as ANSWER EVALUATION');
    const evaluation = await this.evaluateAnswer(question, answer, category, difficulty);
    
    // Only generate next question if interview should continue
    const nextQuestion = await this.generateNextQuestion({
      previousQuestion: question,
      userAnswer: answer,
      score: evaluation.score,
      category,
      difficulty,
      conversationHistory
    });
    
    return { evaluation, nextQuestion };
  }

  async evaluateAnswer(question, answer, category, difficulty) {
    // Validate answer is for the correct question
    const prompt = `You are an expert interviewer. Evaluate this interview answer STRICTLY.

QUESTION ASKED: "${question}"
CATEGORY: ${category}
DIFFICULTY: ${difficulty}

CANDIDATE'S ANSWER: "${answer}"

SCORING RULES:
- 0-30%: Wrong answer, off-topic, or "don't know"
- 31-50%: Partially correct but missing key concepts
- 51-70%: Correct but lacks depth or examples
- 71-85%: Good answer with examples and clarity
- 86-100%: Excellent answer with deep understanding

Return ONLY JSON:
{
  "score": number(0-100),
  "feedback": "string (2-3 sentences)",
  "strengths": ["string"],
  "improvements": ["string"]
}`;

    try {
      const result = await this.callAIWithJSON(prompt, { maxTokens: 4096 });
      
      // Ensure score is reasonable
      let score = result.score || 50;
      
      // Penalize "don't know" or extremely short answers
      const lowerAnswer = answer.toLowerCase();
      if (lowerAnswer.includes("don't know") || lowerAnswer.includes("dont know") || lowerAnswer.includes("no idea") || answer.length < 15) {
        score = Math.min(score, 20);
      }
      
      return {
        score: score,
        feedback: result.feedback || this.getFeedbackByScore(score),
        strengths: result.strengths || [],
        improvements: result.improvements || this.getImprovementsByScore(score)
      };
    } catch (error) {
      console.error('Evaluation error:', error);
      return this.getDefaultEvaluation(answer);
    }
  }
  
  getFeedbackByScore(score) {
    if (score <= 20) return "❌ Incorrect or incomplete answer. Please review the concept and try again.";
    if (score <= 40) return "⚠️ Partially correct but missing key points. Study the topic more thoroughly.";
    if (score <= 60) return "📚 Correct but lacks depth. Add more details and examples.";
    if (score <= 80) return "👍 Good answer! Add more specific examples to improve.";
    return "🎉 Excellent answer! Clear, detailed, and well-structured.";
  }
  
  getImprovementsByScore(score) {
    if (score <= 20) return ["Review basic concepts", "Take time to understand the question", "Provide structured answers"];
    if (score <= 40) return ["Add more technical details", "Explain your thought process", "Use examples"];
    if (score <= 60) return ["Add specific examples", "Quantify your achievements", "Structure your answers better"];
    if (score <= 80) return ["Add more real-world examples", "Deepen technical explanation"];
    return ["Keep up the great work!", "Mentor others on this topic"];
  }

  getDefaultEvaluation(answer) {
    const isShort = answer.length < 20;
    const isDontKnow = answer.toLowerCase().includes("don't know") || answer.toLowerCase().includes("dont know");
    
    let score = 50;
    let feedback = "Good attempt! Keep practicing.";
    let improvements = ["Use STAR method", "Add specific examples"];
    
    if (isDontKnow) {
      score = 10;
      feedback = "You indicated you don't know this. Review the concept and try again.";
      improvements = ["Study this topic", "Practice with similar questions"];
    } else if (isShort) {
      score = 25;
      feedback = "Your answer is too short. Please provide more details.";
      improvements = ["Expand your answer", "Explain your thought process"];
    }
    
    return { score, feedback, strengths: [], improvements };
  }

  async generateNextQuestion(context) {
    const { previousQuestion, userAnswer, score, category, difficulty } = context;
    
    // If score is very low (<30%), ask a simpler question
    // If score is very high (>85%), ask a harder question
    let newDifficulty = difficulty;
    if (score < 30) {
      newDifficulty = 'easy';
    } else if (score > 85) {
      newDifficulty = difficulty === 'hard' ? 'expert' : 'hard';
    }
    
    const prompt = `You are an AI interviewer. Based on the user's answer, generate the next appropriate question.

Previous Question: ${previousQuestion}
User's Answer: ${userAnswer}
Score: ${score}/100
Category: ${category}
Current Difficulty: ${difficulty}
Suggested New Difficulty: ${newDifficulty}

Return ONLY JSON:
{
  "acknowledgment": "string (brief feedback on their answer)",
  "nextQuestion": "string",
  "difficulty": "easy|medium|hard|expert",
  "shouldContinue": true
}`;

    try {
      const result = await this.callAIWithJSON(prompt, { maxTokens: 2048 });
      return {
        acknowledgment: result.acknowledgment || this.getAcknowledgmentByScore(score),
        nextQuestion: result.nextQuestion || "Can you tell me more about your experience?",
        difficulty: result.difficulty || newDifficulty,
        shouldContinue: result.shouldContinue !== false
      };
    } catch (error) {
      console.error('Next question error:', error);
      return {
        acknowledgment: this.getAcknowledgmentByScore(score),
        nextQuestion: "Tell me about a challenging situation you faced and how you handled it.",
        difficulty: difficulty,
        shouldContinue: true
      };
    }
  }
  
  getAcknowledgmentByScore(score) {
    if (score <= 20) return "Let's review this concept. Here's a different question:";
    if (score <= 40) return "Good effort! Let's try something slightly different:";
    if (score <= 60) return "Nice try! Here's the next question:";
    if (score <= 80) return "Well done! Let's continue:";
    return "Excellent answer! Here's a more challenging question:";
  }
}

export default ChatInterviewService;