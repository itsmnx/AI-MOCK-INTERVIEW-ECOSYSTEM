// backend/src/database.js
import knex from 'knex';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL connection
export const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'amie_user',
    password: process.env.DB_PASSWORD || 'amie_password',
    database: process.env.DB_NAME || 'amie_db',
  },
  pool: {
    min: 2,
    max: 10
  }
});

// Create all tables with proper existence checks
export async function initializeDatabase() {
  console.log('📦 Setting up database tables...');

  // Users table with Google OAuth columns
  const usersExists = await db.schema.hasTable('users');
  if (!usersExists) {
    await db.schema.createTable('users', (table) => {
      table.uuid('id').primary().defaultTo(db.raw('gen_random_uuid()'));
      table.string('email').unique().notNullable();
      table.string('password');
      table.string('first_name');
      table.string('last_name');
      table.string('role').defaultTo('candidate');
      table.boolean('onboarding_completed').defaultTo(false);
      table.string('google_id').unique();  // Google OAuth ID
      table.string('profile_picture');      // Profile picture URL
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });
    console.log('  ✅ users table created with Google OAuth columns');
  } else {
    // Add Google OAuth columns if they don't exist
    const hasGoogleId = await db.schema.hasColumn('users', 'google_id');
    if (!hasGoogleId) {
      await db.schema.alterTable('users', (table) => {
        table.string('google_id').unique();
      });
      console.log('  ✅ google_id column added to users');
    }
    
    const hasProfilePicture = await db.schema.hasColumn('users', 'profile_picture');
    if (!hasProfilePicture) {
      await db.schema.alterTable('users', (table) => {
        table.string('profile_picture');
      });
      console.log('  ✅ profile_picture column added to users');
    }
    
    // Make password nullable for Google OAuth users
    const hasPasswordNullable = await db.schema.hasColumn('users', 'password');
    if (hasPasswordNullable) {
      // Check if password column allows NULL - if not, alter it
      await db.schema.raw('ALTER TABLE users ALTER COLUMN password DROP NOT NULL');
      console.log('  ✅ password column made nullable for Google users');
    }
    
    console.log('  ⏭️ users table already exists');
  }

  // User profiles table with profile_picture column
  const profilesExists = await db.schema.hasTable('user_profiles');
  if (!profilesExists) {
    await db.schema.createTable('user_profiles', (table) => {
      table.uuid('id').primary().defaultTo(db.raw('gen_random_uuid()'));
      table.uuid('user_id').unique().references('id').inTable('users').onDelete('CASCADE');
      table.string('phone');
      table.string('location');
      table.text('bio');
      table.string('headline');
      table.string('current_role');
      table.integer('experience_years');
      table.jsonb('skills').defaultTo('[]');
      table.jsonb('projects').defaultTo('[]');
      table.jsonb('target_roles').defaultTo('[]');
      table.jsonb('target_companies').defaultTo('[]');
      table.string('github');
      table.string('linkedin');
      table.string('twitter');
      table.string('portfolio');
      table.string('dream_company');
      table.string('salary_expectation');
      table.string('relocation_preference');
      table.string('notice_period');
      table.string('profile_picture');
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });
    console.log('  ✅ user_profiles table created with profile_picture');
  } else {
    const hasProfilePicture = await db.schema.hasColumn('user_profiles', 'profile_picture');
    if (!hasProfilePicture) {
      await db.schema.alterTable('user_profiles', (table) => {
        table.string('profile_picture');
      });
      console.log('  ✅ profile_picture column added to user_profiles');
    }
    console.log('  ⏭️ user_profiles table already exists');
  }

  // Interview sessions table
  const sessionsExists = await db.schema.hasTable('interview_sessions');
  if (!sessionsExists) {
    await db.schema.createTable('interview_sessions', (table) => {
      table.uuid('id').primary().defaultTo(db.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('type');
      table.string('mode');
      table.string('domain');
      table.string('status').defaultTo('pending');
      table.integer('proctoring_flags').defaultTo(0);
      table.integer('max_flags').defaultTo(5);
      table.jsonb('questions').defaultTo('[]');
      table.jsonb('responses').defaultTo('[]');
      table.integer('current_index').defaultTo(0);
      table.timestamp('started_at');
      table.timestamp('completed_at');
      table.timestamp('scheduled_at');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('  ✅ interview_sessions table created');
  } else {
    console.log('  ⏭️ interview_sessions table already exists');
  }

  // Questions table with domain column
  const questionsExists = await db.schema.hasTable('questions');
  if (!questionsExists) {
    await db.schema.createTable('questions', (table) => {
      table.uuid('id').primary().defaultTo(db.raw('gen_random_uuid()'));
      table.text('text').notNullable();
      table.string('type');
      table.string('difficulty');
      table.string('category');
      table.string('domain');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('  ✅ questions table created');
  } else {
    const hasDomain = await db.schema.hasColumn('questions', 'domain');
    if (!hasDomain) {
      await db.schema.alterTable('questions', (table) => {
        table.string('domain');
      });
      console.log('  ✅ domain column added to questions table');
    }
    console.log('  ⏭️ questions table already exists');
  }

  // Evaluations table with question_text and user_answer columns
  const evaluationsExists = await db.schema.hasTable('evaluations');
  if (!evaluationsExists) {
    await db.schema.createTable('evaluations', (table) => {
      table.uuid('id').primary().defaultTo(db.raw('gen_random_uuid()'));
      table.uuid('session_id').references('id').inTable('interview_sessions').onDelete('CASCADE');
      table.text('question_id');
      table.text('question_text');
      table.text('user_answer');
      table.jsonb('scores').defaultTo('{}');
      table.text('feedback');
      table.jsonb('strengths').defaultTo('[]');
      table.jsonb('improvements').defaultTo('[]');
      table.timestamp('evaluated_at').defaultTo(db.fn.now());
    });
    console.log('  ✅ evaluations table created with question_text and user_answer');
  } else {
    // Add missing columns if they don't exist
    const hasQuestionText = await db.schema.hasColumn('evaluations', 'question_text');
    if (!hasQuestionText) {
      await db.schema.alterTable('evaluations', (table) => {
        table.text('question_text');
      });
      console.log('  ✅ question_text column added to evaluations');
    }
    
    const hasUserAnswer = await db.schema.hasColumn('evaluations', 'user_answer');
    if (!hasUserAnswer) {
      await db.schema.alterTable('evaluations', (table) => {
        table.text('user_answer');
      });
      console.log('  ✅ user_answer column added to evaluations');
    }
    
    console.log('  ⏭️ evaluations table already exists');
  }

  // ============ AI TABLES ============
  
  const resumeDataExists = await db.schema.hasTable('resume_data');
  if (!resumeDataExists) {
    await db.schema.createTable('resume_data', (table) => {
      table.uuid('id').primary().defaultTo(db.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.text('raw_text');
      table.jsonb('skills').defaultTo('[]');
      table.jsonb('technologies').defaultTo('[]');
      table.jsonb('projects').defaultTo('[]');
      table.jsonb('education').defaultTo('[]');
      table.jsonb('experience').defaultTo('[]');
      table.jsonb('certifications').defaultTo('[]');
      table.jsonb('achievements').defaultTo('[]');
      table.jsonb('weak_areas').defaultTo('[]');
      table.jsonb('verified_claims').defaultTo('[]');
      table.jsonb('domains').defaultTo('[]');
      table.jsonb('leadership_experience').defaultTo('[]');
      table.timestamp('parsed_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
      table.index('user_id');
    });
    console.log('  ✅ resume_data table created');
  } else {
    console.log('  ⏭️ resume_data table already exists');
  }

  const interviewPlansExists = await db.schema.hasTable('interview_plans');
  if (!interviewPlansExists) {
    await db.schema.createTable('interview_plans', (table) => {
      table.uuid('id').primary().defaultTo(db.raw('gen_random_uuid()'));
      table.uuid('session_id').references('id').inTable('interview_sessions').onDelete('CASCADE');
      table.jsonb('plan_data').defaultTo('{}');
      table.jsonb('question_categories').defaultTo('{}');
      table.jsonb('focus_areas').defaultTo('[]');
      table.string('difficulty_level').defaultTo('medium');
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.index('session_id');
    });
    console.log('  ✅ interview_plans table created');
  } else {
    console.log('  ⏭️ interview_plans table already exists');
  }

  const detailedEvalsExists = await db.schema.hasTable('detailed_evaluations');
  if (!detailedEvalsExists) {
    await db.schema.createTable('detailed_evaluations', (table) => {
      table.uuid('id').primary().defaultTo(db.raw('gen_random_uuid()'));
      table.uuid('session_id').references('id').inTable('interview_sessions').onDelete('CASCADE');
      table.text('question_id');
      table.jsonb('scores').defaultTo('{}');
      table.text('user_answer');
      table.text('ideal_answer');
      table.text('gap_analysis');
      table.jsonb('strengths').defaultTo('[]');
      table.jsonb('weaknesses').defaultTo('[]');
      table.jsonb('improvement_suggestions').defaultTo('[]');
      table.text('recruiter_interpretation');
      table.integer('difficulty_at_time');
      table.timestamp('evaluated_at').defaultTo(db.fn.now());
      table.index(['session_id', 'evaluated_at']);
    });
    console.log('  ✅ detailed_evaluations table created');
  } else {
    console.log('  ⏭️ detailed_evaluations table already exists');
  }

  const proctoringEventsExists = await db.schema.hasTable('proctoring_events');
  if (!proctoringEventsExists) {
    await db.schema.createTable('proctoring_events', (table) => {
      table.uuid('id').primary().defaultTo(db.raw('gen_random_uuid()'));
      table.uuid('session_id').references('id').inTable('interview_sessions').onDelete('CASCADE');
      table.string('event_type');
      table.jsonb('event_data').defaultTo('{}');
      table.integer('flag_count');
      table.string('severity').defaultTo('normal');
      table.timestamp('occurred_at').defaultTo(db.fn.now());
      table.index(['session_id', 'occurred_at']);
      table.index('event_type');
    });
    console.log('  ✅ proctoring_events table created');
  } else {
    console.log('  ⏭️ proctoring_events table already exists');
  }

  const learningRoadmapsExists = await db.schema.hasTable('learning_roadmaps');
  if (!learningRoadmapsExists) {
    await db.schema.createTable('learning_roadmaps', (table) => {
      table.uuid('id').primary().defaultTo(db.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('plan_type');
      table.jsonb('roadmap_data').defaultTo('{}');
      table.jsonb('topics').defaultTo('[]');
      table.jsonb('milestones').defaultTo('[]');
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('completed_at');
      table.index(['user_id', 'is_active']);
    });
    console.log('  ✅ learning_roadmaps table created');
  } else {
    console.log('  ⏭️ learning_roadmaps table already exists');
  }

  const commAnalyticsExists = await db.schema.hasTable('communication_analytics');
  if (!commAnalyticsExists) {
    await db.schema.createTable('communication_analytics', (table) => {
      table.uuid('id').primary().defaultTo(db.raw('gen_random_uuid()'));
      table.uuid('session_id').references('id').inTable('interview_sessions').onDelete('CASCADE');
      table.integer('speaking_speed');
      table.integer('confidence_score');
      table.integer('clarity_score');
      table.integer('fluency_score');
      table.integer('presence_score');
      table.jsonb('filler_words').defaultTo('[]');
      table.jsonb('grammar_issues').defaultTo('[]');
      table.jsonb('pronunciation_issues').defaultTo('[]');
      table.timestamp('analyzed_at').defaultTo(db.fn.now());
      table.index('session_id');
    });
    console.log('  ✅ communication_analytics table created');
  } else {
    console.log('  ⏭️ communication_analytics table already exists');
  }

  const skillGapExists = await db.schema.hasTable('skill_gap_analysis');
  if (!skillGapExists) {
    await db.schema.createTable('skill_gap_analysis', (table) => {
      table.uuid('id').primary().defaultTo(db.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.jsonb('gaps').defaultTo('[]');
      table.jsonb('recommendations').defaultTo('[]');
      table.jsonb('priority_areas').defaultTo('[]');
      table.timestamp('analyzed_at').defaultTo(db.fn.now());
      table.index('user_id');
    });
    console.log('  ✅ skill_gap_analysis table created');
  } else {
    console.log('  ⏭️ skill_gap_analysis table already exists');
  }

  const companyTemplatesExists = await db.schema.hasTable('company_templates');
  if (!companyTemplatesExists) {
    await db.schema.createTable('company_templates', (table) => {
      table.uuid('id').primary().defaultTo(db.raw('gen_random_uuid()'));
      table.string('company_name');
      table.jsonb('question_bank').defaultTo('[]');
      table.jsonb('focus_areas').defaultTo('[]');
      table.jsonb('evaluation_criteria').defaultTo('[]');
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.index('company_name');
    });
    console.log('  ✅ company_templates table created');
  } else {
    console.log('  ⏭️ company_templates table already exists');
  }

  console.log('✅ Database setup complete');
}

// Seed default questions
export async function seedQuestions() {
  const count = await db('questions').count('id as count').first();
  if (parseInt(count.count) === 0) {
    const defaultQuestions = [
      // DSA Easy
      { text: "What is the difference between array and linked list?", type: "technical", difficulty: "easy", category: "dsa", domain: "dsa" },
      { text: "What is the time complexity of binary search?", type: "technical", difficulty: "easy", category: "dsa", domain: "dsa" },
      { text: "What is a stack? Give real-world applications.", type: "technical", difficulty: "easy", category: "dsa", domain: "dsa" },
      // DSA Medium
      { text: "What is a hash table and how does it work?", type: "technical", difficulty: "medium", category: "dsa", domain: "dsa" },
      { text: "Explain recursion with an example.", type: "technical", difficulty: "medium", category: "dsa", domain: "dsa" },
      { text: "What is the difference between BFS and DFS?", type: "technical", difficulty: "medium", category: "dsa", domain: "dsa" },
      // DSA Hard
      { text: "What is dynamic programming? Explain with an example.", type: "technical", difficulty: "hard", category: "dsa", domain: "dsa" },
      { text: "How would you detect a cycle in a linked list?", type: "technical", difficulty: "hard", category: "dsa", domain: "dsa" },
      // Behavioral
      { text: "Tell me about yourself.", type: "behavioral", difficulty: "easy", category: "general", domain: "general" },
      { text: "What are your greatest strengths?", type: "behavioral", difficulty: "easy", category: "general", domain: "general" },
      { text: "Describe a challenging project you worked on.", type: "behavioral", difficulty: "medium", category: "general", domain: "general" },
      { text: "How do you handle conflict in a team?", type: "behavioral", difficulty: "medium", category: "general", domain: "general" },
      { text: "Where do you see yourself in 5 years?", type: "behavioral", difficulty: "medium", category: "general", domain: "general" },
      // HR
      { text: "Why do you want to work here?", type: "hr", difficulty: "easy", category: "hr", domain: "hr" },
      { text: "What are your salary expectations?", type: "hr", difficulty: "easy", category: "hr", domain: "hr" },
      { text: "Why should we hire you?", type: "hr", difficulty: "medium", category: "hr", domain: "hr" },
    ];
    
    for (const q of defaultQuestions) {
      await db('questions').insert(q);
    }
    console.log(`✅ ${defaultQuestions.length} questions seeded`);
  } else {
    console.log('⏭️ Questions already seeded');
  }
}

// Test connection
export async function testConnection() {
  try {
    await db.raw('SELECT 1');
    console.log('✅ PostgreSQL connected!');
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    return false;
  }
}

// Database helper functions
export async function getUserByEmail(email) {
  return db('users').where({ email }).first();
}

export async function getUserById(id) {
  return db('users').where({ id }).first();
}

export async function createUser(user) {
  const [created] = await db('users').insert(user).returning('*');
  return created;
}

export async function updateUser(id, updates) {
  const [updated] = await db('users')
    .where({ id })
    .update({ ...updates, updated_at: db.fn.now() })
    .returning('*');
  return updated;
}

export async function getUserProfile(userId) {
  return db('user_profiles').where({ user_id: userId }).first();
}

export async function upsertUserProfile(profile) {
  const existing = await getUserProfile(profile.user_id);
  if (existing) {
    const [updated] = await db('user_profiles')
      .where({ user_id: profile.user_id })
      .update({ 
        ...profile, 
        profile_picture: profile.profile_picture || existing.profile_picture,
        updated_at: db.fn.now() 
      })
      .returning('*');
    return updated;
  } else {
    const [created] = await db('user_profiles').insert({
      ...profile,
      profile_picture: profile.profile_picture || null,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');
    return created;
  }
}

export async function createInterviewSession(session) {
  const [created] = await db('interview_sessions').insert(session).returning('*');
  return created;
}

export async function getUserSessions(userId) {
  return db('interview_sessions').where({ user_id: userId }).orderBy('created_at', 'desc');
}

export async function updateSession(sessionId, updates) {
  const [updated] = await db('interview_sessions')
    .where({ id: sessionId })
    .update(updates)
    .returning('*');
  return updated;
}

export async function deleteAllSessions(userId) {
  await db('evaluations')
    .whereIn('session_id', function() {
      this.select('id').from('interview_sessions').where({ user_id: userId });
    })
    .delete();
  
  const deleted = await db('interview_sessions').where({ user_id: userId }).delete();
  return deleted;
}

export async function deleteSingleSession(sessionId, userId) {
  const session = await db('interview_sessions')
    .where({ id: sessionId, user_id: userId })
    .first();
  
  if (!session) return null;
  
  await db('evaluations').where({ session_id: sessionId }).delete();
  const deleted = await db('interview_sessions').where({ id: sessionId }).delete();
  return deleted;
}

export async function getAllQuestions(filters = {}) {
  let query = db('questions');
  if (filters.type) query = query.where({ type: filters.type });
  if (filters.difficulty) query = query.where({ difficulty: filters.difficulty });
  if (filters.domain) query = query.where({ domain: filters.domain });
  return query;
}

export async function saveEvaluation(evaluation) {
  const [saved] = await db('evaluations').insert(evaluation).returning('*');
  return saved;
}

export async function getSessionEvaluations(sessionId) {
  return db('evaluations').where({ session_id: sessionId });
}

// ============ AI ENHANCEMENT FUNCTIONS ============

export async function saveResumeData(userId, resumeData) {
  const tableExists = await db.schema.hasTable('resume_data');
  if (!tableExists) return null;
  
  const existing = await db('resume_data').where({ user_id: userId }).first();
  
  if (existing) {
    const [updated] = await db('resume_data')
      .where({ user_id: userId })
      .update({
        raw_text: resumeData.raw_text,
        skills: JSON.stringify(resumeData.skills || []),
        technologies: JSON.stringify(resumeData.technologies || []),
        projects: JSON.stringify(resumeData.projects || []),
        education: JSON.stringify(resumeData.education || []),
        experience: JSON.stringify(resumeData.experience || []),
        certifications: JSON.stringify(resumeData.certifications || []),
        achievements: JSON.stringify(resumeData.achievements || []),
        weak_areas: JSON.stringify(resumeData.weak_areas || []),
        domains: JSON.stringify(resumeData.domains || []),
        updated_at: new Date()
      })
      .returning('*');
    return updated;
  } else {
    const [created] = await db('resume_data').insert({
      user_id: userId,
      raw_text: resumeData.raw_text,
      skills: JSON.stringify(resumeData.skills || []),
      technologies: JSON.stringify(resumeData.technologies || []),
      projects: JSON.stringify(resumeData.projects || []),
      education: JSON.stringify(resumeData.education || []),
      experience: JSON.stringify(resumeData.experience || []),
      certifications: JSON.stringify(resumeData.certifications || []),
      achievements: JSON.stringify(resumeData.achievements || []),
      weak_areas: JSON.stringify(resumeData.weak_areas || []),
      domains: JSON.stringify(resumeData.domains || []),
      parsed_at: new Date(),
      updated_at: new Date()
    }).returning('*');
    return created;
  }
}

export async function getResumeData(userId) {
  try {
    const tableExists = await db.schema.hasTable('resume_data');
    if (!tableExists) return null;
    return db('resume_data').where({ user_id: userId }).first();
  } catch (error) {
    console.error('getResumeData error:', error.message);
    return null;
  }
}

export async function saveInterviewPlan(sessionId, planData) {
  const tableExists = await db.schema.hasTable('interview_plans');
  if (!tableExists) return null;
  
  const [saved] = await db('interview_plans').insert({
    session_id: sessionId,
    plan_data: JSON.stringify(planData.plan_data || {}),
    question_categories: JSON.stringify(planData.question_categories || {}),
    focus_areas: JSON.stringify(planData.focus_areas || []),
    difficulty_level: planData.difficulty_level || 'medium',
    created_at: new Date()
  }).returning('*');
  return saved;
}

export async function getInterviewPlan(sessionId) {
  try {
    const tableExists = await db.schema.hasTable('interview_plans');
    if (!tableExists) return null;
    return db('interview_plans').where({ session_id: sessionId }).first();
  } catch (error) {
    return null;
  }
}

export async function saveDetailedEvaluation(evaluation) {
  const tableExists = await db.schema.hasTable('detailed_evaluations');
  if (!tableExists) return null;
  
  const [saved] = await db('detailed_evaluations').insert({
    session_id: evaluation.session_id,
    question_id: evaluation.question_id,
    scores: JSON.stringify(evaluation.scores || {}),
    user_answer: evaluation.user_answer,
    ideal_answer: evaluation.ideal_answer,
    gap_analysis: evaluation.gap_analysis,
    strengths: JSON.stringify(evaluation.strengths || []),
    weaknesses: JSON.stringify(evaluation.weaknesses || []),
    improvement_suggestions: JSON.stringify(evaluation.improvement_suggestions || []),
    recruiter_interpretation: evaluation.recruiter_interpretation,
    difficulty_at_time: evaluation.difficulty_at_time,
    evaluated_at: new Date()
  }).returning('*');
  return saved;
}

export async function getDetailedEvaluations(sessionId) {
  try {
    const tableExists = await db.schema.hasTable('detailed_evaluations');
    if (!tableExists) return [];
    return db('detailed_evaluations').where({ session_id: sessionId }).orderBy('evaluated_at', 'asc');
  } catch (error) {
    return [];
  }
}

export async function saveProctoringEvent(event) {
  const tableExists = await db.schema.hasTable('proctoring_events');
  if (!tableExists) return null;
  
  const [saved] = await db('proctoring_events').insert({
    session_id: event.session_id,
    event_type: event.event_type,
    event_data: JSON.stringify(event.event_data || {}),
    flag_count: event.flag_count,
    severity: event.severity || 'normal',
    occurred_at: new Date()
  }).returning('*');
  return saved;
}

export async function getProctoringEvents(sessionId) {
  try {
    const tableExists = await db.schema.hasTable('proctoring_events');
    if (!tableExists) return [];
    return db('proctoring_events').where({ session_id: sessionId }).orderBy('occurred_at', 'asc');
  } catch (error) {
    return [];
  }
}

export async function saveLearningRoadmap(userId, roadmapData) {
  const tableExists = await db.schema.hasTable('learning_roadmaps');
  if (!tableExists) return null;
  
  const [saved] = await db('learning_roadmaps').insert({
    user_id: userId,
    plan_type: roadmapData.plan_type,
    roadmap_data: JSON.stringify(roadmapData.roadmap_data || {}),
    topics: JSON.stringify(roadmapData.topics || []),
    milestones: JSON.stringify(roadmapData.milestones || []),
    is_active: true,
    created_at: new Date()
  }).returning('*');
  return saved;
}

export async function getActiveLearningRoadmap(userId) {
  try {
    const tableExists = await db.schema.hasTable('learning_roadmaps');
    if (!tableExists) return null;
    return db('learning_roadmaps')
      .where({ user_id: userId, is_active: true })
      .orderBy('created_at', 'desc')
      .first();
  } catch (error) {
    return null;
  }
}

export async function saveCommunicationAnalytics(analytics) {
  const tableExists = await db.schema.hasTable('communication_analytics');
  if (!tableExists) return null;
  
  const [saved] = await db('communication_analytics').insert({
    session_id: analytics.session_id,
    speaking_speed: analytics.speaking_speed,
    confidence_score: analytics.confidence_score,
    clarity_score: analytics.clarity_score,
    fluency_score: analytics.fluency_score,
    presence_score: analytics.presence_score,
    filler_words: JSON.stringify(analytics.filler_words || []),
    grammar_issues: JSON.stringify(analytics.grammar_issues || []),
    analyzed_at: new Date()
  }).returning('*');
  return saved;
}

export async function getCommunicationAnalytics(sessionId) {
  try {
    const tableExists = await db.schema.hasTable('communication_analytics');
    if (!tableExists) return null;
    return db('communication_analytics').where({ session_id: sessionId }).first();
  } catch (error) {
    return null;
  }
}

// Export everything
export default {
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
  createInterviewSession,
  getUserSessions,
  updateSession,
  deleteAllSessions,
  deleteSingleSession,
  getAllQuestions,
  saveEvaluation,
  getSessionEvaluations,
  saveResumeData,
  getResumeData,
  saveInterviewPlan,
  getInterviewPlan,
  saveDetailedEvaluation,
  getDetailedEvaluations,
  saveProctoringEvent,
  getProctoringEvents,
  saveLearningRoadmap,
  getActiveLearningRoadmap,
  saveCommunicationAnalytics,
  getCommunicationAnalytics
};