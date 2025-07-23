import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDatabase() {
  console.log('🔍 Checking database connectivity and tables...\n');

  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('   Auth status:', user ? 'Authenticated' : 'Not authenticated');
    if (authError) console.log('   Auth error:', authError.message);

    // Check if tables exist
    const tables = [
      'userRoles',
      'visitActivities', 
      'sellingPoints',
      'companies',
      'people',
      'addresses',
      'personRoles',
      'companyCategories',
      'companySellingPoint',
      'visits',
      'visitPhotos'
    ];

    console.log('\n2. Checking table existence...');
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ ${table}: Table exists`);
        }
      } catch (err) {
        console.log(`   ❌ ${table}: ${err.message}`);
      }
    }

    // Test specific queries that are failing
    console.log('\n3. Testing failing queries...');
    
    // Test userRoles query
    console.log('   Testing userRoles query...');
    const { data: userRoles, error: userRolesError } = await supabase
      .from('userRoles')
      .select('role')
      .eq('isActive', true)
      .limit(1);
    
    if (userRolesError) {
      console.log(`   ❌ userRoles query failed: ${userRolesError.message}`);
    } else {
      console.log(`   ✅ userRoles query successful (${userRoles?.length || 0} results)`);
    }

    // Test visitActivities query
    console.log('   Testing visitActivities query...');
    const { data: activities, error: activitiesError } = await supabase
      .from('visitActivities')
      .select('*')
      .eq('isactive', true)
      .limit(1);
    
    if (activitiesError) {
      console.log(`   ❌ visitActivities query failed: ${activitiesError.message}`);
    } else {
      console.log(`   ✅ visitActivities query successful (${activities?.length || 0} results)`);
    }

    // Test sellingPoints query
    console.log('   Testing sellingPoints query...');
    const { data: sellingPoints, error: sellingPointsError } = await supabase
      .from('sellingPoints')
      .select('*')
      .eq('isactive', true)
      .limit(1);
    
    if (sellingPointsError) {
      console.log(`   ❌ sellingPoints query failed: ${sellingPointsError.message}`);
    } else {
      console.log(`   ✅ sellingPoints query successful (${sellingPoints?.length || 0} results)`);
    }

  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

checkDatabase(); 