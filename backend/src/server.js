// backend/src/server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { OAuth2Client } from 'google-auth-library';
import { 
  db,
  initializeDatabase, 
  seedQuestions, 
  testConnection,
  getUserByEmail, 
  getUserById, 
  createUser, 
  updateUser,
  getUserProfile,
  upsertUserProfile,
  getUserSessions,
  deleteAllSessions,
  deleteSingleSession,
  getAllQuestions,
  getResumeData
} from './database.js';

// Import AI Services
import AnswerEvaluatorService from './services/ai/answerEvaluatorService.js';
import QuestionGeneratorService from './services/ai/questionGeneratorService.js';
import ChatInterviewService from './services/ai/chatInterviewService.js';

// Import centralized AI routes
import aiRoutes from './routes/v2/aiRoutes.js';

// Import Email Services
import { sendOTPEmail, sendWelcomeEmail } from './services/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Google OAuth Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ===============================
// File Upload Configuration
// ===============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only images, PDF, and DOC files are allowed'));
  }
});

// Profile picture upload configuration
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/profiles/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const profileUpload = multer({ 
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  }
});

// ===============================
// Middleware
// ===============================
app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
if (!fs.existsSync('uploads/profiles')) fs.mkdirSync('uploads/profiles', { recursive: true });

// ===============================
// Database Initialization
// ===============================
await testConnection();
await initializeDatabase();
await seedQuestions();

console.log('📦 Database initialized successfully');

// ===============================
// Helper Functions
// ===============================
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

function safeJSONParse(str, defaultValue = []) {
  if (!str || str === 'null' || str === 'undefined') return defaultValue;
  if (typeof str === 'object') return str;
  if (typeof str === 'string') {
    try { return JSON.parse(str); }
    catch (e) { console.error('JSON Parse error:', e.message); return defaultValue; }
  }
  return defaultValue;
}

function generateDetailedSummary(score) {
  if (score >= 85) return { level: "Excellent", message: "Outstanding performance!", encouragement: "Keep up the great work!" };
  if (score >= 70) return { level: "Good", message: "Good job! Focus on refining your answers.", encouragement: "With more practice, you'll be interview-ready!" };
  if (score >= 50) return { level: "Satisfactory", message: "Decent attempt. Work on structuring your answers.", encouragement: "Regular practice will help you improve." };
  return { level: "Needs Improvement", message: "Focus on building foundational knowledge.", encouragement: "Every expert was once a beginner. Keep practicing!" };
}

// Initialize AI Services
const evaluatorService = new AnswerEvaluatorService();
const questionGenerator = new QuestionGeneratorService();
const chatService = new ChatInterviewService();
console.log('🤖 AI Services initialized');

// ===============================
// Auth Routes
// ===============================
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'candidate' } = req.body;
    
    const existingUser = await getUserByEmail(email);
    if (existingUser) return res.status(400).json({ error: 'User already exists' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = {
      email,
      password: hashedPassword,
      first_name: firstName,
      last_name: lastName,
      role,
      onboarding_completed: false
    };
    
    const createdUser = await createUser(user);
    
    // Send welcome email (don't block registration if email fails)
    sendWelcomeEmail(email, `${firstName} ${lastName}`).catch(console.error);
    
    const token = jwt.sign(
      { id: createdUser.id, email: createdUser.email, role: createdUser.role },
      process.env.JWT_SECRET || 'secret'
    );
    
    res.json({
      user: { 
        id: createdUser.id, 
        email, 
        firstName, 
        lastName, 
        role,
        onboardingCompleted: false 
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await getUserByEmail(email);
    
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    // Check if user has password (for Google OAuth users)
    if (!user.password) {
      return res.status(401).json({ error: 'Please login with Google' });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret'
    );
    
    res.json({
      user: { 
        id: user.id, 
        email, 
        firstName: user.first_name, 
        lastName: user.last_name, 
        role: user.role,
        onboardingCompleted: user.onboarding_completed || false
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/v1/auth/me', auth, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      user: { 
        id: user.id, 
        email: user.email, 
        firstName: user.first_name, 
        lastName: user.last_name, 
        role: user.role,
        onboardingCompleted: user.onboarding_completed || false
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// ===============================
// Google OAuth Login
// ===============================
app.post('/api/v1/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }
    
    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;
    
    // Check if user exists
    let user = await getUserByEmail(email);
    
    if (!user) {
      // Create new user
      const [newUser] = await db('users').insert({
        email,
        first_name: name?.split(' ')[0] || '',
        last_name: name?.split(' ').slice(1).join(' ') || '',
        google_id: googleId,
        profile_picture: picture,
        onboarding_completed: false,
        role: 'candidate',
        created_at: new Date(),
        updated_at: new Date()
      }).returning('*');
      user = newUser;
    } else if (!user.google_id) {
      // Update existing user with google_id
      await db('users')
        .where({ id: user.id })
        .update({ 
          google_id: googleId,
          profile_picture: picture,
          updated_at: new Date()
        });
      user.google_id = googleId;
      user.profile_picture = picture;
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        profilePicture: user.profile_picture,
        onboardingCompleted: user.onboarding_completed || false
      },
      token
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Google login failed' });
  }
});

// ===============================
// Forgot Password with OTP (Updated with Email)
// ===============================
app.post('/api/v1/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (!user.password) {
      return res.status(400).json({ success: false, message: 'Please login with Google' });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    
    const hasOtpTable = await db.schema.hasTable('otp_verification');
    if (!hasOtpTable) {
      await db.schema.createTable('otp_verification', (table) => {
        table.increments('id');
        table.string('email');
        table.string('otp');
        table.timestamp('expires_at');
        table.timestamp('created_at').defaultTo(db.fn.now());
      });
    }
    
    await db('otp_verification').insert({
      email,
      otp,
      expires_at: otpExpiry,
      created_at: new Date()
    });
    
    // Send email with OTP
    const emailResult = await sendOTPEmail(email, otp, user.first_name);
    
    // For development, also log to console
    if (process.env.NODE_ENV === 'development') {
      console.log(`📧 [DEV] OTP for ${email}: ${otp}`);
    }
    
    if (emailResult.success) {
      res.json({ success: true, message: 'OTP sent to your email' });
    } else {
      // Fallback: return OTP in response for testing
      console.log(`⚠️ Email failed, returning OTP in response for ${email}`);
      res.json({ 
        success: true, 
        message: 'OTP generated (email configuration issue)',
        otp: otp // Only in development
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

app.post('/api/v1/auth/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    // Verify OTP
    const otpRecord = await db('otp_verification')
      .where({ email, otp })
      .where('expires_at', '>', new Date())
      .first();
    
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user password
    await db('users')
      .where({ email })
      .update({ password: hashedPassword, updated_at: new Date() });
    
    // Delete used OTP
    await db('otp_verification').where({ email, otp }).delete();
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

// ===============================
// Test Email Endpoint
// ===============================
app.post('/api/v1/auth/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const otp = '123456';
    const result = await sendOTPEmail(email, otp, 'Test User');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// Onboarding Routes
// ===============================
app.post('/api/v1/onboarding', auth, async (req, res) => {
  try {
    const profileData = req.body;
    
    // Update user onboarding status
    await updateUser(req.user.id, { onboarding_completed: true });
    
    const profile = {
      user_id: req.user.id,
      phone: profileData.phone,
      location: profileData.location,
      bio: profileData.bio,
      headline: profileData.headline,
      current_role: profileData.currentRole,
      experience_years: profileData.experienceYears,
      skills: JSON.stringify(profileData.skills || []),
      projects: JSON.stringify(profileData.projects || []),
      target_roles: JSON.stringify(profileData.targetRoles || []),
      target_companies: JSON.stringify(profileData.targetCompanies || []),
      github: profileData.github,
      linkedin: profileData.linkedin,
      twitter: profileData.twitter,
      portfolio: profileData.portfolio,
      dream_company: profileData.dreamCompany,
      salary_expectation: profileData.salaryExpectation,
      relocation_preference: profileData.relocationPreference,
      notice_period: profileData.noticePeriod,
      profile_picture: profileData.profilePicture || null
    };
    
    await upsertUserProfile(profile);
    
    res.json({ success: true, message: 'Profile completed successfully' });
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ error: 'Failed to save profile: ' + error.message });
  }
});

app.get('/api/v1/profile', auth, async (req, res) => {
  try {
    const profile = await getUserProfile(req.user.id);
    const user = await getUserById(req.user.id);
    
    if (profile) {
      profile.skills = safeJSONParse(profile.skills);
      profile.projects = safeJSONParse(profile.projects);
      profile.targetRoles = safeJSONParse(profile.target_roles);
      profile.targetCompanies = safeJSONParse(profile.target_companies);
    }
    
    res.json({ 
      profile: profile || null,
      user: { 
        id: user?.id, 
        firstName: user?.first_name, 
        lastName: user?.last_name,
        email: user?.email,
        onboardingCompleted: user?.onboarding_completed || false
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// ===============================
// Profile Picture Upload Routes
// ===============================
app.post('/api/v1/upload/profile-picture', auth, profileUpload.single('profilePicture'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/profiles/${file.filename}`;
    
    const existingProfile = await db('user_profiles').where({ user_id: req.user.id }).first();
    
    if (existingProfile) {
      await db('user_profiles')
        .where({ user_id: req.user.id })
        .update({ 
          profile_picture: imageUrl,
          updated_at: new Date()
        });
    } else {
      await db('user_profiles').insert({
        user_id: req.user.id,
        profile_picture: imageUrl,
        updated_at: new Date()
      });
    }
    
    res.json({ 
      success: true, 
      url: imageUrl,
      message: 'Profile picture uploaded successfully' 
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
});

app.get('/api/v1/profile-picture', auth, async (req, res) => {
  try {
    const profile = await db('user_profiles')
      .where({ user_id: req.user.id })
      .first();
    
    res.json({ 
      success: true, 
      profilePicture: profile?.profile_picture || null 
    });
  } catch (error) {
    console.error('Get profile picture error:', error);
    res.status(500).json({ error: 'Failed to get profile picture' });
  }
});

// ===============================
// Interview Routes
// ===============================
app.post('/api/v1/interviews/schedule', auth, async (req, res) => {
  try {
    const { type, mode, domain, scheduledAt, difficulty, questionCount, customQuestions } = req.body;
    
    let sessionQuestions = [];
    
    if (customQuestions && Array.isArray(customQuestions) && customQuestions.length > 0) {
      sessionQuestions = customQuestions;
    } else {
      const questions = await getAllQuestions();
      let filtered = questions;
      if (difficulty) {
        filtered = questions.filter(q => q.difficulty === difficulty);
      }
      sessionQuestions = filtered.slice(0, questionCount || 5);
    }
    
    const sessionId = uuidv4();
    
    const session = {
      id: sessionId,
      user_id: req.user.id,
      type: type || 'domain',
      mode: mode || 'chat',
      domain: domain || 'general',
      status: scheduledAt ? 'scheduled' : 'in_progress',
      questions: JSON.stringify(sessionQuestions),
      responses: JSON.stringify([]),
      current_index: 0,
      proctoring_flags: 0,
      max_flags: 5,
      scheduled_at: scheduledAt || null,
      started_at: scheduledAt ? null : new Date(),
      created_at: new Date()
    };
    
    await db('interview_sessions').insert(session);
    
    res.json({ 
      sessionId: sessionId, 
      session: {
        id: sessionId,
        questions: sessionQuestions,
        currentIndex: 0,
        responses: [],
        status: scheduledAt ? 'scheduled' : 'in_progress'
      }
    });
  } catch (error) {
    console.error('Schedule interview error:', error);
    res.status(500).json({ error: 'Failed to create interview: ' + error.message });
  }
});

app.get('/api/v1/interviews/sessions/:sessionId', auth, async (req, res) => {
  try {
    const session = await db('interview_sessions')
      .where({ id: req.params.sessionId, user_id: req.user.id })
      .first();
    
    if (!session) return res.status(404).json({ error: 'Session not found' });
    
    const questions = safeJSONParse(session.questions);
    const responses = safeJSONParse(session.responses);
    
    res.json({
      id: session.id,
      user_id: session.user_id,
      type: session.type,
      mode: session.mode,
      domain: session.domain,
      status: session.status,
      questions: questions,
      responses: responses,
      current_index: session.current_index,
      proctoring_flags: session.proctoring_flags,
      max_flags: session.max_flags,
      started_at: session.started_at,
      completed_at: session.completed_at,
      created_at: session.created_at
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to get session: ' + error.message });
  }
});

app.post('/api/v1/interviews/sessions/:sessionId/responses', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questionId, responseText } = req.body;
    
    const session = await db('interview_sessions')
      .where({ id: sessionId, user_id: req.user.id })
      .first();
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const questions = safeJSONParse(session.questions);
    const currentQuestion = questions.find(q => q.id === questionId);
    const questionText = currentQuestion?.text || 'Question not found';
    
    let responses = safeJSONParse(session.responses);
    
    const response = {
      id: uuidv4(),
      questionId,
      questionText: questionText,
      responseText,
      submittedAt: new Date()
    };
    responses.push(response);
    
    const responseLength = responseText.length;
    const hasExamples = /example|project|experience|specific/i.test(responseText);
    const hasMetrics = /\d+%|\d+\s*(years|months|projects|users)/i.test(responseText);
    
    let overallScore = 60;
    if (responseLength > 100) overallScore += 10;
    if (hasExamples) overallScore += 15;
    if (hasMetrics) overallScore += 10;
    overallScore = Math.min(100, overallScore);
    
    let feedback = "";
    let strengths = [];
    let improvements = [];
    
    if (overallScore >= 85) {
      feedback = "Excellent answer! Great structure and specific examples.";
      strengths = ["Clear structure", "Specific examples", "Good communication"];
      improvements = ["Keep up the great work!"];
    } else if (overallScore >= 70) {
      feedback = "Good answer! Add more specific examples to strengthen your response.";
      strengths = ["Good effort", "Relevant to question"];
      improvements = ["Add quantifiable results", "Use more specific examples"];
    } else if (overallScore >= 50) {
      feedback = "Your answer needs more structure and specific examples. Try the STAR method.";
      strengths = ["Attempted to answer"];
      improvements = ["Use STAR method", "Add specific examples", "Quantify achievements"];
    } else {
      feedback = "Please provide a more detailed answer. Focus on explaining your thought process.";
      strengths = ["Made an attempt"];
      improvements = ["Provide more details", "Structure your answer", "Use examples"];
    }
    
    const evaluation = {
      id: uuidv4(),
      session_id: sessionId,
      question_id: questionId,
      question_text: questionText,
      user_answer: responseText,
      scores: JSON.stringify({
        overall: overallScore,
        clarity: Math.min(100, overallScore + 5),
        relevance: Math.min(100, overallScore + 5),
        confidence: Math.min(100, overallScore - 5)
      }),
      feedback: feedback,
      strengths: JSON.stringify(strengths),
      improvements: JSON.stringify(improvements),
      evaluated_at: new Date()
    };
    
    await db('evaluations').insert(evaluation);
    
    const currentIndex = (session.current_index || 0) + 1;
    await db('interview_sessions')
      .where({ id: sessionId })
      .update({
        responses: JSON.stringify(responses),
        current_index: currentIndex
      });
    
    res.json({ 
      success: true,
      response: response, 
      evaluation: {
        id: evaluation.id,
        scores: JSON.parse(evaluation.scores),
        feedback: evaluation.feedback,
        strengths: JSON.parse(evaluation.strengths),
        improvements: JSON.parse(evaluation.improvements)
      }
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ error: 'Failed to submit answer: ' + error.message });
  }
});

app.post('/api/v1/interviews/sessions/:sessionId/complete', auth, async (req, res) => {
  try {
    await db('interview_sessions')
      .where({ id: req.params.sessionId, user_id: req.user.id })
      .update({ status: 'completed', completed_at: new Date() });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

app.get('/api/v1/interviews/sessions/:sessionId/feedback', auth, async (req, res) => {
  try {
    const session = await db('interview_sessions')
      .where({ id: req.params.sessionId, user_id: req.user.id })
      .first();
    
    if (!session) return res.status(404).json({ error: 'Session not found' });
    
    const evaluations = await db('evaluations')
      .where({ session_id: req.params.sessionId })
      .orderBy('evaluated_at', 'asc');
    
    const parsedEvaluations = evaluations.map(evalItem => ({
      id: evalItem.id,
      question_text: evalItem.question_text || 'Question not available',
      user_answer: evalItem.user_answer || 'Answer not recorded',
      scores: safeJSONParse(evalItem.scores, {}),
      feedback: evalItem.feedback,
      strengths: safeJSONParse(evalItem.strengths),
      improvements: safeJSONParse(evalItem.improvements),
      evaluated_at: evalItem.evaluated_at
    }));
    
    const avgScore = parsedEvaluations.length > 0
      ? parsedEvaluations.reduce((sum, e) => sum + (e.scores.overall || 0), 0) / parsedEvaluations.length
      : 0;
    
    const summary = generateDetailedSummary(avgScore);
    const questions = safeJSONParse(session.questions);
    
    res.json({
      sessionId: session.id,
      averageScore: avgScore,
      level: summary.level,
      summary: summary.message,
      encouragement: summary.encouragement,
      evaluations: parsedEvaluations,
      strengths: ["Good effort", "Completed the interview"],
      improvements: ["Practice structuring answers", "Use more examples"],
      practicePlan: {
        focusAreas: ["Technical communication", "Confidence building"],
        dailyGoal: "Practice 2-3 questions daily using the STAR method",
        weeklyTarget: "Complete 3 full mock interviews",
        recommendedQuestions: questions.slice(0, 3).map(q => q.text || q)
      }
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ error: 'Failed to get feedback: ' + error.message });
  }
});

// ===============================
// Proctoring Routes
// ===============================
app.post('/api/v1/interviews/:sessionId/flag', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { violationType } = req.body;
    
    const session = await db('interview_sessions')
      .where({ id: sessionId, user_id: req.user.id })
      .first();
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const violationWeights = {
      tab_switch: 1,
      window_blur: 1,
      copy_paste: 2,
      right_click: 1,
      fullscreen_exit: 2,
      copy_attempt: 1,
      cut_attempt: 1,
      paste_attempt: 1,
      keyboard_shortcut: 1
    };
    
    const flagValue = violationWeights[violationType] || 1;
    const currentFlags = (session.proctoring_flags || 0) + flagValue;
    const maxFlags = session.max_flags || 5;
    
    await db('proctoring_events').insert({
      id: uuidv4(),
      session_id: sessionId,
      event_type: violationType,
      event_data: JSON.stringify({ timestamp: new Date() }),
      flag_count: flagValue,
      severity: flagValue >= 2 ? 'high' : 'normal',
      occurred_at: new Date()
    });
    
    const newStatus = currentFlags >= maxFlags ? 'cancelled' : session.status;
    
    await db('interview_sessions')
      .where({ id: sessionId })
      .update({ 
        proctoring_flags: currentFlags,
        status: newStatus
      });
    
    const shouldTerminate = currentFlags >= maxFlags;
    
    res.json({
      success: true,
      flagsUsed: currentFlags,
      flagsRemaining: maxFlags - currentFlags,
      shouldTerminate,
      cancelled: shouldTerminate
    });
    
  } catch (error) {
    console.error('Flag error:', error);
    res.status(500).json({ error: 'Failed to report violation' });
  }
});

app.get('/api/v1/interviews/:sessionId/proctoring', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await db('interview_sessions')
      .where({ id: sessionId, user_id: req.user.id })
      .first();
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const events = await db('proctoring_events')
      .where({ session_id: sessionId })
      .orderBy('occurred_at', 'desc');
    
    res.json({
      flagsUsed: session.proctoring_flags || 0,
      maxFlags: session.max_flags || 5,
      remainingFlags: (session.max_flags || 5) - (session.proctoring_flags || 0),
      isTerminated: session.status === 'cancelled',
      events: events.map(e => ({
        type: e.event_type,
        timestamp: e.occurred_at,
        severity: e.severity
      }))
    });
    
  } catch (error) {
    console.error('Proctoring status error:', error);
    res.status(500).json({ error: 'Failed to get proctoring status' });
  }
});

// ===============================
// Session Management Routes
// ===============================
app.delete('/api/v1/sessions/all', auth, async (req, res) => {
  try {
    const deleted = await deleteAllSessions(req.user.id);
    res.json({ success: true, message: `Successfully deleted ${deleted} sessions` });
  } catch (error) {
    console.error('Delete all sessions error:', error);
    res.status(500).json({ error: 'Failed to clear sessions: ' + error.message });
  }
});

app.delete('/api/v1/sessions/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID format' });
    }
    
    const deleted = await deleteSingleSession(sessionId, req.user.id);
    if (deleted === null) return res.status(404).json({ error: 'Session not found' });
    
    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Failed to delete session: ' + error.message });
  }
});

app.get('/api/v1/sessions/history', auth, async (req, res) => {
  try {
    const userSessions = await getUserSessions(req.user.id);
    res.json({
      sessions: userSessions,
      total: userSessions.length,
      completed: userSessions.filter(s => s.status === 'completed').length,
      cancelled: userSessions.filter(s => s.status === 'cancelled').length
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

// ===============================
// Questions Routes
// ===============================
app.get('/api/v1/questions', auth, async (req, res) => {
  try {
    const { search, domain, type, difficulty } = req.query;
    let questions = await getAllQuestions();
    
    if (domain && domain !== 'all' && domain !== 'undefined') {
      questions = questions.filter(q => q.domain === domain);
    }
    
    if (type && type !== 'all' && type !== 'undefined') {
      questions = questions.filter(q => q.type === type);
    }
    
    if (difficulty && difficulty !== 'all' && difficulty !== 'undefined') {
      questions = questions.filter(q => q.difficulty === difficulty);
    }
    
    if (search && search.trim() !== '') {
      const searchLower = search.toLowerCase();
      questions = questions.filter(q => q.text.toLowerCase().includes(searchLower));
    }
    
    res.json({ questions, total: questions.length });
  } catch (error) {
    console.error('Questions error:', error);
    res.status(500).json({ error: 'Failed to get questions' });
  }
});

// ===============================
// Resume Routes
// ===============================
app.post('/api/v1/resume/upload', auth, upload.single('resume'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    
    const resumeData = {
      fileName: file.originalname,
      fileSize: file.size,
      uploadedAt: new Date()
    };
    
    res.json({ success: true, data: resumeData });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ error: 'Failed to upload resume' });
  }
});

app.get('/api/v1/resume', auth, async (req, res) => {
  try {
    const resumeData = await getResumeData(req.user.id);
    res.json({ success: true, data: resumeData });
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({ error: 'Failed to get resume data' });
  }
});

// ===============================
// Dashboard Routes
// ===============================
app.get('/api/v1/dashboard', auth, async (req, res) => {
  try {
    const userSessions = await getUserSessions(req.user.id);
    const user = await getUserById(req.user.id);
    const resumeData = await getResumeData(req.user.id);
    
    let totalScore = 0;
    let completedCount = 0;
    
    for (const session of userSessions) {
      if (session.status === 'completed') {
        const evaluations = await db('evaluations').where({ session_id: session.id });
        if (evaluations.length > 0) {
          const sessionScore = evaluations.reduce((sum, evaluationItem) => {
            const scores = safeJSONParse(evaluationItem.scores, {});
            return sum + (scores.overall || 0);
          }, 0) / evaluations.length;
          totalScore += sessionScore;
          completedCount++;
        }
      }
    }
    
    const averageScore = completedCount > 0 ? totalScore / completedCount : 0;
    
    res.json({
      stats: {
        totalSessions: userSessions.length,
        completedSessions: userSessions.filter(s => s.status === 'completed').length,
        averageScore: Math.round(averageScore),
        improvementRate: 12
      },
      recentSessions: userSessions.slice(-5).map(s => ({
        id: s.id,
        date: s.created_at,
        status: s.status,
        type: s.type
      })),
      recommendations: [
        { title: "Practice Behavioral Questions", description: "Focus on STAR method", link: "/interview/select" },
        { title: "Review Technical Concepts", description: "System design fundamentals", link: "/questions" }
      ],
      onboardingCompleted: user?.onboarding_completed || false,
      hasResume: !!resumeData
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard' });
  }
});

// ===============================
// AI Routes (V1 - Legacy support)
// ===============================
app.post('/api/v1/ai/evaluate', auth, async (req, res) => {
  try {
    const { question, answer, category, difficulty } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }
    
    const evaluation = await evaluatorService.evaluateAnswer(question, answer, { 
      category: category || 'technical', 
      difficulty: difficulty || 'medium' 
    });
    
    res.json({ success: true, evaluation });
  } catch (error) {
    console.error('AI evaluate error:', error);
    res.status(500).json({ error: 'Evaluation failed: ' + error.message });
  }
});

app.post('/api/v1/ai/generate-questions', auth, async (req, res) => {
  try {
    const { type, domain, difficulty, count, role, resumeContext } = req.body;
    
    console.log(`🤖 Generating ${count || 5} ${difficulty || 'medium'} ${type || 'technical'} questions for domain: ${domain || 'general'}`);
    
    const questions = await questionGenerator.generateQuestions({
      type: type || 'technical',
      domain: domain || 'general',
      difficulty: difficulty || 'medium',
      count: count || 5,
      role: role || 'Software Engineer',
      resumeContext: resumeContext || null
    });
    
    res.json({ success: true, questions });
  } catch (error) {
    console.error('Question generation error:', error);
    res.status(500).json({ error: 'Question generation failed: ' + error.message });
  }
});

app.post('/api/v1/ai/chat/evaluate', auth, async (req, res) => {
  try {
    const { question, answer, category, difficulty, conversationHistory } = req.body;
    
    console.log('📥 Chat evaluate request:', { 
      question: question?.substring(0, 50), 
      answerProvided: !!answer,
      category 
    });
    
    if (!question) return res.status(400).json({ error: 'Question is required' });
    
    const result = await chatService.evaluateAndNext(
      question, 
      answer || "",
      category || 'general', 
      difficulty || 'easy', 
      conversationHistory || []
    );
    
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Chat evaluation error:', error);
    res.status(500).json({ error: 'Failed to process chat: ' + error.message });
  }
});

app.post('/api/v1/ai/follow-up', auth, async (req, res) => {
  try {
    const { question, answer, score } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }
    
    const followUp = await evaluatorService.generateFollowUp(question, answer, score || 70);
    res.json({ success: true, followUp });
  } catch (error) {
    console.error('Follow-up error:', error);
    res.status(500).json({ error: 'Failed to generate follow-up' });
  }
});

app.get('/api/v1/ai/test', auth, async (req, res) => {
  try {
    const testResult = await evaluatorService.callAI("Say 'AI is working!' in one sentence.");
    res.json({ 
      success: true, 
      message: 'AI is connected!', 
      response: testResult,
      provider: process.env.AI_PROVIDER || 'gemini',
      hasApiKey: !!process.env.AI_API_KEY
    });
  } catch (error) {
    console.error('AI test error:', error);
    res.json({ 
      success: false, 
      error: error.message,
      hasApiKey: !!process.env.AI_API_KEY
    });
  }
});

// ===============================
// V2 AI Routes (Mounted)
// ===============================
app.use('/api/v2/ai', auth, (req, res, next) => {
  req.db = db;
  next();
}, aiRoutes);

// ===============================
// Test Routes
// ===============================
app.get('/api/v1/test', (req, res) => {
  res.json({ message: 'Server running with PostgreSQL!', timestamp: new Date().toISOString() });
});

// ===============================
// Start Server
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📝 Auth, Interview, Resume, Dashboard routes available under /api/v1/...`);
  console.log(`📝 AI endpoints: /api/v1/ai/* and /api/v2/ai/*`);
});