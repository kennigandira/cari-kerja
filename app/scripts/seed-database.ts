/**
 * Seed the Supabase database with job data from seed-data.json
 *
 * This script:
 * 1. Reads the generated seed-data.json file
 * 2. Connects to Supabase
 * 3. Inserts all job records into the database
 *
 * Usage:
 *   bun run app/scripts/seed-database.ts
 *   or
 *   npx tsx app/scripts/seed-database.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Database } from '../shared/supabase-types';

// Get current directory (ESM compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('   Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  console.error('   or: SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

interface SeedData {
  generated_at: string;
  total_jobs: number;
  jobs: any[];
}

async function loadSeedData(): Promise<SeedData> {
  const seedDataPath = join(__dirname, 'seed-data.json');
  console.log(`📖 Reading seed data from: ${seedDataPath}`);

  const fileContent = readFileSync(seedDataPath, 'utf-8');
  return JSON.parse(fileContent);
}

async function clearExistingData() {
  console.log('\n🧹 Clearing existing seed data...');

  const { error } = await supabase
    .from('jobs')
    .delete()
    .like('folder_path', '04_Applications/%');

  if (error) {
    console.error('❌ Error clearing existing data:', error.message);
    throw error;
  }

  console.log('✅ Existing seed data cleared');
}

async function insertJobs(jobs: any[]) {
  console.log(`\n📥 Inserting ${jobs.length} jobs...`);

  let successCount = 0;
  let errorCount = 0;

  // Insert jobs in batches of 10 to avoid overwhelming the database
  const batchSize = 10;
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('jobs')
      .insert(batch)
      .select();

    if (error) {
      console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      errorCount += batch.length;
    } else {
      successCount += data?.length || 0;
      console.log(`  ✅ Batch ${Math.floor(i / batchSize) + 1} inserted (${data?.length || 0} jobs)`);
    }
  }

  console.log(`\n📊 Insert Summary:`);
  console.log(`  Success: ${successCount} jobs`);
  console.log(`  Errors: ${errorCount} jobs`);

  return { successCount, errorCount };
}

async function verifyData() {
  console.log('\n🔍 Verifying inserted data...');

  const { data, error, count } = await supabase
    .from('jobs')
    .select('*', { count: 'exact' })
    .like('folder_path', '04_Applications/%');

  if (error) {
    console.error('❌ Error verifying data:', error.message);
    return;
  }

  console.log(`✅ Verified ${count} jobs in database`);

  if (data && data.length > 0) {
    console.log('\n📋 Sample jobs:');
    data.slice(0, 5).forEach((job: any) => {
      console.log(`  • ${job.company_name} - ${job.position_title} (${job.match_percentage}%)`);
    });
  }
}

async function main() {
  console.log('🌱 Starting database seeding process...\n');

  try {
    // Load seed data
    const seedData = await loadSeedData();
    console.log(`✅ Loaded ${seedData.total_jobs} jobs from seed file`);
    console.log(`📅 Generated at: ${seedData.generated_at}`);

    // Prompt for confirmation
    console.log('\n⚠️  This will clear existing seed data and insert new records.');
    console.log('Press Ctrl+C to cancel or wait 3 seconds to continue...\n');

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Clear existing data
    await clearExistingData();

    // Insert new data
    const { successCount, errorCount } = await insertJobs(seedData.jobs);

    // Verify data
    await verifyData();

    // Print statistics
    console.log('\n📊 Statistics:');
    const jobsWithMatch = seedData.jobs.filter((j: any) => j.match_percentage);
    if (jobsWithMatch.length > 0) {
      const avgMatch = jobsWithMatch.reduce((sum: number, j: any) => sum + j.match_percentage, 0) / jobsWithMatch.length;
      console.log(`  Average match: ${avgMatch.toFixed(1)}%`);
      console.log(`  Jobs with location: ${seedData.jobs.filter((j: any) => j.location).length}`);
      console.log(`  Jobs with salary: ${seedData.jobs.filter((j: any) => j.salary_range).length}`);
    }

    console.log('\n✅ Database seeding complete!');

    if (errorCount > 0) {
      console.log(`\n⚠️  Warning: ${errorCount} jobs failed to insert. Check the error messages above.`);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the main function
main();
