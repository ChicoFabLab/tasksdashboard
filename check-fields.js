// Quick script to check if created/created_by fields exist in PocketBase
const PocketBase = require('pocketbase');

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

async function checkFields() {
  try {
    // Fetch one task
    const records = await pb.collection('tasks').getList(1, 1);
    
    if (records.items.length > 0) {
      const task = records.items[0];
      console.log('\n=== TASK FIELDS CHECK ===');
      console.log('All fields:', Object.keys(task));
      console.log('\n✓ created_by exists?', 'created_by' in task);
      console.log('  Value:', task.created_by);
      console.log('\n✓ created exists?', 'created' in task);
      console.log('  Value:', task.created);
      console.log('\n✓ updated exists?', 'updated' in task);
      console.log('  Value:', task.updated);
      console.log('\n========================\n');
      
      if (!task.created || !task.created_by) {
        console.log('⚠️  ISSUE: One or more fields are missing!');
        console.log('   We need to add these fields to your PocketBase schema.\n');
      }
    } else {
      console.log('No tasks found in database.');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkFields();

