// backend/src/database/migrations/20240101000007_add_ai_tables.js

export async function up(knex) {
  console.log('📦 Creating AI enhancement tables...');

  // 1. Resume data table - stores parsed resume information
  await knex.schema.createTable('resume_data', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
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
    table.timestamp('parsed_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index('user_id');
  });
  console.log('  ✅ resume_data table created');

  // 2. Interview plans table - stores AI-generated interview plans
  await knex.schema.createTable('interview_plans', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('session_id').references('id').inTable('interview_sessions').onDelete('CASCADE');
    table.jsonb('plan_data').defaultTo('{}');
    table.jsonb('question_categories').defaultTo('{}');
    table.jsonb('focus_areas').defaultTo('[]');
    table.string('difficulty_level').defaultTo('medium');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index('session_id');
  });
  console.log('  ✅ interview_plans table created');

  // 3. Detailed evaluations table - stores AI-powered answer evaluations
  await knex.schema.createTable('detailed_evaluations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('session_id').references('id').inTable('interview_sessions').onDelete('CASCADE');
    table.uuid('question_id');
    table.jsonb('scores').defaultTo('{}');
    table.text('user_answer');
    table.text('ideal_answer');
    table.text('gap_analysis');
    table.jsonb('strengths').defaultTo('[]');
    table.jsonb('weaknesses').defaultTo('[]');
    table.jsonb('improvement_suggestions').defaultTo('[]');
    table.text('recruiter_interpretation');
    table.integer('difficulty_at_time');
    table.timestamp('evaluated_at').defaultTo(knex.fn.now());
    table.index(['session_id', 'evaluated_at']);
  });
  console.log('  ✅ detailed_evaluations table created');

  // 4. Proctoring events table - tracks all violations during interview
  await knex.schema.createTable('proctoring_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('session_id').references('id').inTable('interview_sessions').onDelete('CASCADE');
    table.string('event_type');
    table.jsonb('event_data').defaultTo('{}');
    table.integer('flag_count');
    table.string('severity').defaultTo('normal');
    table.timestamp('occurred_at').defaultTo(knex.fn.now());
    table.index(['session_id', 'occurred_at']);
    table.index('event_type');
  });
  console.log('  ✅ proctoring_events table created');

  // 5. Learning roadmaps table - stores personalized learning plans
  await knex.schema.createTable('learning_roadmaps', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('plan_type'); // weekly, monthly, quarterly
    table.jsonb('roadmap_data').defaultTo('{}');
    table.jsonb('topics').defaultTo('[]');
    table.jsonb('milestones').defaultTo('[]');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('completed_at');
    table.index(['user_id', 'is_active']);
  });
  console.log('  ✅ learning_roadmaps table created');

  // 6. Communication analytics table - stores speech/communication analysis
  await knex.schema.createTable('communication_analytics', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('session_id').references('id').inTable('interview_sessions').onDelete('CASCADE');
    table.integer('speaking_speed'); // words per minute
    table.integer('confidence_score'); // 0-100
    table.integer('clarity_score'); // 0-100
    table.integer('fluency_score'); // 0-100
    table.integer('presence_score'); // 0-100
    table.jsonb('filler_words').defaultTo('[]');
    table.jsonb('grammar_issues').defaultTo('[]');
    table.jsonb('pronunciation_issues').defaultTo('[]');
    table.timestamp('analyzed_at').defaultTo(knex.fn.now());
    table.index('session_id');
  });
  console.log('  ✅ communication_analytics table created');

  // 7. Skill gap analysis table
  await knex.schema.createTable('skill_gap_analysis', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.jsonb('gaps').defaultTo('[]');
    table.jsonb('recommendations').defaultTo('[]');
    table.jsonb('priority_areas').defaultTo('[]');
    table.timestamp('analyzed_at').defaultTo(knex.fn.now());
    table.index('user_id');
  });
  console.log('  ✅ skill_gap_analysis table created');

  // 8. Company interview templates table
  await knex.schema.createTable('company_templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('company_name');
    table.jsonb('question_bank').defaultTo('[]');
    table.jsonb('focus_areas').defaultTo('[]');
    table.jsonb('evaluation_criteria').defaultTo('[]');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index('company_name');
  });
  console.log('  ✅ company_templates table created');

  console.log('✅ AI enhancement tables setup complete!');
}

export async function down(knex) {
  console.log('🗑️ Dropping AI enhancement tables...');
  
  await knex.schema.dropTableIfExists('company_templates');
  await knex.schema.dropTableIfExists('skill_gap_analysis');
  await knex.schema.dropTableIfExists('communication_analytics');
  await knex.schema.dropTableIfExists('learning_roadmaps');
  await knex.schema.dropTableIfExists('proctoring_events');
  await knex.schema.dropTableIfExists('detailed_evaluations');
  await knex.schema.dropTableIfExists('interview_plans');
  await knex.schema.dropTableIfExists('resume_data');
  
  console.log('✅ AI enhancement tables dropped!');
}