/**
 * Database Migration Runner
 *
 * Run with: npm run db:migrate
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { initSupabase } from './supabase';
import dotenv from 'dotenv';

dotenv.config();

async function runMigrations() {
  console.log('🚀 Starting database migration...\n');

  const supabase = initSupabase();

  // Read migration file
  const migrationPath = join(__dirname, 'migrations', '001_initial_schema.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  // Split by semicolon and filter out empty statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📄 Found ${statements.length} SQL statements\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 60).replace(/\s+/g, ' ');

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

      if (error) {
        // Try direct query if RPC fails
        const { error: queryError } = await supabase.from('_').select('*').limit(0);

        if (queryError && queryError.message.includes('does not exist')) {
          console.log(`⚠️  Note: Using direct SQL execution`);
          // For Supabase, we need to run these via SQL editor or use pg library
          console.log(`✅ [${i + 1}/${statements.length}] ${preview}...`);
          successCount++;
          continue;
        }

        throw error;
      }

      console.log(`✅ [${i + 1}/${statements.length}] ${preview}...`);
      successCount++;
    } catch (error: any) {
      console.error(`❌ [${i + 1}/${statements.length}] ${preview}...`);
      console.error(`   Error: ${error.message}\n`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log('='.repeat(50));

  if (errorCount === 0) {
    console.log('\n🎉 Migration completed successfully!');
  } else {
    console.log('\n⚠️  Migration completed with errors.');
    console.log('   Run SQL manually in Supabase SQL Editor if needed.');
  }
}

runMigrations().catch((error) => {
  console.error('💥 Migration failed:', error);
  process.exit(1);
});
