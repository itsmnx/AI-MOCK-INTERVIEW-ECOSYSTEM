// backend/src/services/ai/feedbackGeneratorService.js
import BaseAIService from './baseAIService.js';

class FeedbackGeneratorService extends BaseAIService {
  async generateComprehensiveReport(sessionData, evaluations, resumeData) {
    const prompt = `Generate a comprehensive interview feedback report:

SESSION DATA:
Type: ${sessionData.type}
Domain: ${sessionData.domain}
Duration: ${sessionData.duration} minutes
Questions Answered: ${evaluations.length}

EVALUATIONS:
${JSON.stringify(evaluations, null, 2)}

RESUME PROFILE:
${JSON.stringify(resumeData, null, 2)}

Generate a professional report with:

1. Executive Summary (2-3 paragraphs)
2. Overall Performance Metrics
3. Technical Competency Analysis
4. Communication Assessment
5. Behavioral Evaluation
6. Resume Verification Summary
7. Strengths Identified
8. Areas for Improvement
9. Skill Gap Analysis
10. Learning Roadmap Recommendations
11. Recruiter Readiness Score (0-100)
12. Verdict (Strong Hire, Hire, Consider, Reject)

Make it detailed, actionable, and professional. Return as JSON.`;

    const report = await this.callAIWithJSON(prompt);
    return report;
  }

  async generateLearningRoadmap(weakAreas, skillGaps, timeframe = '30days') {
    const prompt = `Create a personalized learning roadmap:

Weak Areas: ${JSON.stringify(weakAreas)}
Skill Gaps: ${JSON.stringify(skillGaps)}
Timeframe: ${timeframe}

Generate a structured roadmap with:

1. Weekly breakdown of topics to learn
2. Daily study schedule (2-3 hours/day)
3. Resources for each topic (articles, videos, courses)
4. Practice exercises and projects
5. Milestones and checkpoints
6. Assessment criteria

Return as JSON with structure:
{
  "title": string,
  "duration": string,
  "weeklyPlan": [
    {
      "week": number,
      "focus": string,
      "topics": [string],
      "resources": [string],
      "exercises": [string],
      "milestone": string
    }
  ],
  "dailySchedule": {
    "weekdays": [string],
    "weekend": [string]
  },
  "recommendedResources": [string],
  "successMetrics": [string]
}`;

    const roadmap = await this.callAIWithJSON(prompt);
    return roadmap;
  }
}

export default FeedbackGeneratorService;