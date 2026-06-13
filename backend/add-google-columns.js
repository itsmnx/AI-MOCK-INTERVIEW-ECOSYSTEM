// backend/add-google-columns.js
import { db } from './src/database.js';

async function addGoogleColumns() {
  console.log('🔄 Adding Google OAuth columns to users table...');
  
  try {
    // Check if google_id column exists
    const hasGoogleId = await db.schema.hasColumn('users', 'google_id');
    if (!hasGoogleId) {
      await db.schema.alterTable('users', (table) => {
        table.string('google_id').unique();
      });
      console.log('✅ google_id column added');
    } else {
      console.log('⏭️ google_id column already exists');
    }
    
    // Check if profile_picture column exists
    const hasProfilePicture = await db.schema.hasColumn('users', 'profile_picture');
    if (!hasProfilePicture) {
      await db.schema.alterTable('users', (table) => {
        table.string('profile_picture');
      });
      console.log('✅ profile_picture column added');
    } else {
      console.log('⏭️ profile_picture column already exists');
    }
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

addGoogleColumns();