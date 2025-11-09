/**
 * Test script to diagnose expansion issues
 * Run with: node backend/routes/test-expansion.js
 */

const supabase = require('../config/supabase');

async function testExpansionSupport() {
  console.log('=== Testing Expansion Support ===\n');

  try {
    // 1. Check if story_level column exists
    const { data: conversations, error: selectError } = await supabase
      .from('conversations')
      .select('id, story_level, parent_story_id, accumulated_metadata, user_inputs_history')
      .limit(1);

    if (selectError) {
      console.error('❌ Error selecting from conversations:', selectError.message);
      console.error('\nLikely cause: Migration not run. Please run the SQL migration from:');
      console.error('database/add_story_expansion_support.sql');
      return;
    }

    console.log('✅ All expansion columns exist in conversations table');
    
    if (conversations && conversations.length > 0) {
      const sample = conversations[0];
      console.log('\nSample conversation data:');
      console.log('- ID:', sample.id);
      console.log('- Story Level:', sample.story_level || 'NULL (needs update)');
      console.log('- Parent Story ID:', sample.parent_story_id || 'NULL');
      console.log('- Has Metadata:', !!sample.accumulated_metadata);
      console.log('- Has History:', !!sample.user_inputs_history);
    } else {
      console.log('\nNo conversations found in database');
    }

    // 2. Check for helper functions
    console.log('\n=== Testing Helper Functions ===');
    
    try {
      // This will fail if function doesn't exist
      const { data: testData, error: funcError } = await supabase
        .rpc('can_expand_story', { story_id: '00000000-0000-0000-0000-000000000000' });
      
      if (funcError && funcError.message.includes('does not exist')) {
        console.log('⚠️  Helper function can_expand_story not found');
        console.log('   Run the SQL migration to create it');
      } else {
        console.log('✅ Helper functions available');
      }
    } catch (e) {
      console.log('⚠️  Could not test helper functions:', e.message);
    }

    console.log('\n=== Diagnosis Complete ===');
    console.log('If you see errors above, run this migration:');
    console.log('database/add_story_expansion_support.sql\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testExpansionSupport().then(() => process.exit(0));
