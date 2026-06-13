// backend/src/routes/v2/aiRoutes.js
import express from 'express';
import multer from 'multer';
import { auth } from '../../middleware/auth.js';
import ResumeIntelligenceService from '../../services/ai/resumeIntelligenceService.js';
import InterviewPlannerService from '../../services/ai/interviewPlannerService.js';
import AnswerEvaluatorService from '../../services/ai/answerEvaluatorService.js';
import FeedbackGeneratorService from '../../services/ai/feedbackGeneratorService.js';
import ProctoringService from '../../services/ai/proctoringService.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/resumes/' });

const resumeService = new ResumeIntelligenceService();
const plannerService = new InterviewPlannerService();
const evaluatorService = new AnswerEvaluatorService();
const feedbackService = new FeedbackGeneratorService();
const proctoringService = new ProctoringService();

// ===============================
// Resume Parsing
// ===============================
router.post('/resume/parse', auth, upload.single('resume'), async (req, res) => {
  try {
    const file = req.file;
    const fileType = file.originalname.split('.').pop();
    const parsedData = await resumeService.parseResume(file.path, fileType);

    await req.db('resume_data').insert({
      user_id: req.user.id,
      raw_text: parsedData.raw_text,
      skills: JSON.stringify(parsedData.skills),
      technologies: JSON.stringify(parsedData.technologies),
      projects: JSON.stringify(parsedData.projects),
      education: JSON.stringify(parsedData.education),
      experience: JSON.stringify(parsedData.experience),
      certifications: JSON.stringify(parsedData.certifications),
      achievements: JSON.stringify(parsedData.achievements),
      weak_areas: JSON.stringify(parsedData.weak_areas),
      parsed_at: new Date()
    });

    res.json({ success: true, data: parsedData });
  } catch (error) {
    console.error('Resume parse error:', error);
    res.status(500).json({ error: 'Failed to parse resume' });
  }
});

// ===============================
// Interview Plan Generation
// ===============================
router.post('/plan/generate', auth, async (req, res) => {
  try {
    const { sessionId, type, domain, role, experienceLevel, difficulty, questionCount } = req.body;

    const resumeData = await req.db('resume_data').where({ user_id: req.user.id }).first();
    const previousSessions = await req.db('interview_sessions')
      .where({ user_id: req.user.id, status: 'completed' })
      .orderBy('created_at', 'desc')
      .limit(10);

    const plan = await plannerService.generateInterviewPlan(
      { type, domain, role, experienceLevel, difficulty, questionCount },
      resumeData,
      previousSessions
    );

    await req.db('interview_plans').insert({
      session_id: sessionId,
      plan_data: JSON.stringify(plan),
      question_categories: JSON.stringify(plan.categories),
      difficulty_level: difficulty,
      created_at: new Date()
    });

    res.json({ success: true, plan });
  } catch (error) {
    console.error('Plan generation error:', error);
    res.status(500).json({ error: 'Failed to generate interview plan' });
  }
});

// ===============================
// Answer Evaluation
// ===============================
router.post('/evaluate', auth, async (req, res) => {
  try {
    const { question, answer, category, difficulty, sessionId } = req.body;

    const evaluation = await evaluatorService.evaluateAnswer(question, answer, {
      category,
      difficulty
    });

    await req.db('detailed_evaluations').insert({
      session_id: sessionId,
      question_id: req.body.questionId,
      scores: JSON.stringify(evaluation.scores),
      user_answer: answer,
      ideal_answer: evaluation.idealAnswer,
      strengths: JSON.stringify(evaluation.strengths),
      weaknesses: JSON.stringify(evaluation.weaknesses),
      improvement_suggestions: JSON.stringify(evaluation.improvementTips),
      difficulty_at_time: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : difficulty === 'hard' ? 3 : 4,
      evaluated_at: new Date()
    });

    const followUp = await evaluatorService.generateFollowUp(question, answer, evaluation.overallScore);

    res.json({
      evaluation,
      followUp: followUp.shouldAskFollowUp ? followUp : null
    });
  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({ error: 'Failed to evaluate answer' });
  }
});

// ===============================
// Final Report
// ===============================
router.post('/report/generate', auth, async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await req.db('interview_sessions').where({ id: sessionId }).first();
    const evaluations = await req.db('detailed_evaluations')
      .where({ session_id: sessionId })
      .orderBy('evaluated_at', 'asc');

    const resumeData = await req.db('resume_data').where({ user_id: req.user.id }).first();
    const proctoringEvents = await req.db('proctoring_events')
      .where({ session_id: sessionId })
      .orderBy('occurred_at', 'asc');

    const report = await feedbackService.generateComprehensiveReport(session, evaluations, resumeData);

    report.proctoring = proctoringService.generateViolationReport(proctoringEvents);

    res.json({ success: true, report });
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// ===============================
// Learning Roadmap
// ===============================
router.post('/roadmap/generate', auth, async (req, res) => {
  try {
    const { sessionId, timeframe = '30days' } = req.body;

    const evaluations = await req.db('detailed_evaluations').where({ session_id: sessionId });

    const weakAreas = [];
    // ✅ FIXED: Changed 'eval' to 'evaluationItem'
    evaluations.forEach(evaluationItem => {
      const weaknesses = JSON.parse(evaluationItem.weaknesses || '[]');
      weakAreas.push(...weaknesses);
    });

    const roadmap = await feedbackService.generateLearningRoadmap(weakAreas, [], timeframe);

    await req.db('learning_roadmaps').insert({
      user_id: req.user.id,
      plan_type: timeframe,
      roadmap_data: JSON.stringify(roadmap),
      topics: JSON.stringify(weakAreas),
      is_active: true,
      created_at: new Date()
    });

    res.json({ success: true, roadmap });
  } catch (error) {
    console.error('Roadmap generation error:', error);
    res.status(500).json({ error: 'Failed to generate roadmap' });
  }
});

// ===============================
// Proctoring Violations
// ===============================
router.post('/proctoring/violation', auth, async (req, res) => {
  try {
    const { sessionId, violationType, metadata } = req.body;

    const violation = proctoringService.analyzeViolation(violationType, metadata);

    await req.db('proctoring_events').insert({
      session_id: sessionId,
      event_type: violation.type,
      event_data: JSON.stringify(metadata),
      flag_count: violation.weight,
      occurred_at: violation.timestamp
    });

    const events = await req.db('proctoring_events').where({ session_id: sessionId });
    const totalFlags = events.reduce((sum, event) => sum + event.flag_count, 0);

    const shouldTerminate = proctoringService.shouldTerminateInterview(totalFlags);

    if (shouldTerminate) {
      await req.db('interview_sessions')
        .where({ id: sessionId })
        .update({ status: 'cancelled', completed_at: new Date() });
    }

    res.json({
      success: true,
      flagValue: violation.weight,
      totalFlags,
      shouldTerminate,
      flagsRemaining: proctoringService.maxFlags - totalFlags
    });
  } catch (error) {
    console.error('Proctoring error:', error);
    res.status(500).json({ error: 'Failed to report violation' });
  }
});

export default router;