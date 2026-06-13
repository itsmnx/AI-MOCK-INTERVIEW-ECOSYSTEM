// backend/src/services/ai/interviewPlannerService.js
import BaseAIService from './baseAIService.js';

class InterviewPlannerService extends BaseAIService {
  async generateInterviewPlan(sessionData, resumeData, previousSessions = []) {
    const {
      type,
      domain,
      difficulty = 'medium',
      questionCount = 10,
      role,
      experienceLevel
    } = sessionData;
    
    // Analyze previous weak areas
    const weakAreas = this.extractWeakAreas(previousSessions);
    
    const prompt = `Create a personalized interview plan based on:

Interview Type: ${type}
Domain: ${domain}
Role: ${role || 'Software Engineer'}
Experience Level: ${experienceLevel || 'Mid-Level'}
Difficulty: ${difficulty}
Number of Questions: ${questionCount}

Resume Profile:
${JSON.stringify(resumeData, null, 2)}

Previous Weak Areas:
${JSON.stringify(weakAreas, null, 2)}

Generate a plan with:

1. Question Categories Distribution:
   - Resume Questions (20%)
   - Technical Questions (30%)
   - Project Questions (20%)
   - Behavioral Questions (20%)
   - Situational Questions (10%)

2. For each category, generate specific questions based on the resume.
3. Assign difficulty levels to each question.
4. Identify potential follow-up opportunities.

Return as JSON with structure:
{
  "categories": {
    "resume": { "percentage": 20, "questions": [] },
    "technical": { "percentage": 30, "questions": [] },
    "projects": { "percentage": 20, "questions": [] },
    "behavioral": { "percentage": 20, "questions": [] },
    "situational": { "percentage": 10, "questions": [] }
  },
  "totalQuestions": ${questionCount},
  "difficulty": "${difficulty}",
  "focusAreas": []
}`;

    const plan = await this.callAIWithJSON(prompt);
    return plan;
  }

  extractWeakAreas(previousSessions) {
    const weakAreas = [];
    
    // ✅ FIXED: Changed 'eval' to 'evaluationItem'
    previousSessions.forEach(session => {
      if (session.evaluations) {
        session.evaluations.forEach(evaluationItem => {
          if (evaluationItem.weaknesses) {
            weakAreas.push(...evaluationItem.weaknesses);
          }
        });
      }
    });
    
    // Count frequency of weak areas
    const weakAreaCount = {};
    weakAreas.forEach(area => {
      weakAreaCount[area] = (weakAreaCount[area] || 0) + 1;
    });
    
    return Object.entries(weakAreaCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([area]) => area);
  }

  async adaptDifficulty(sessionId, previousAnswers) {
    const prompt = `Based on these answers, determine if difficulty should change:

Answers:
${JSON.stringify(previousAnswers, null, 2)}

Analyze:
1. Average answer quality (0-100)
2. Consistency
3. Depth of understanding

Return JSON:
{
  "shouldIncreaseDifficulty": boolean,
  "shouldDecreaseDifficulty": boolean,
  "newDifficulty": "easy|medium|hard|expert",
  "reason": "explanation",
  "confidence": 0-100
}`;

    const result = await this.callAIWithJSON(prompt);
    return result;
  }
}

export default InterviewPlannerService;