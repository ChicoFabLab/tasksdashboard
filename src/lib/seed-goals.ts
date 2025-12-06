import PocketBase from 'pocketbase';
import { MAKERSPACE_COURSES } from './courses';

/**
 * Seed SBU (Safety Basic Use) goals into PocketBase
 * Run this script once to populate the goals collection
 * 
 * Usage: ts-node --esm src/lib/seed-goals.ts
 * Or create API endpoint and call it once
 */

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

// Define which courses are SBU safety trainings (must be preserved)
const SBU_COURSE_IDS = [
  '3d-printing-sbu',
  'laser-sbu',
  'electronics-sbu',
  'woodshop-sbu',
  'cnc-shopbot-sbu',
];

export async function seedSBUGoals() {
  try {
    console.log('Starting SBU goals seeding...');
    
    // 1. Delete all non-SBU goals from goals collection
    console.log('Deleting non-SBU goals...');
    try {
      const existingGoals = await pb.collection('goals').getFullList({
        filter: 'is_sbu = false',
      });
      
      for (const goal of existingGoals) {
        await pb.collection('goals').delete(goal.id);
        console.log(`  Deleted non-SBU goal: ${goal.title}`);
      }
      console.log(`  Deleted ${existingGoals.length} non-SBU goals`);
    } catch (err: any) {
      if (err.status === 404 || err.message?.includes('doesn\'t exist')) {
        console.log('  Goals collection doesn\'t exist yet or no goals to delete');
      } else {
        throw err;
      }
    }

    // 2. Seed or update SBU goals from courses.ts
    console.log('Seeding SBU goals from courses.ts...');
    let created = 0;
    let updated = 0;
    
    for (const course of MAKERSPACE_COURSES) {
      const isSBU = SBU_COURSE_IDS.includes(course.id);
      
      const goalData = {
        title: course.title,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        estimated_minutes: course.estimated_minutes,
        icon: course.icon,
        zone_leader: course.zoneLeader,
        sbu_schedule: course.sbuSchedule,
        is_sbu: isSBU,
        steps: course.steps,
        prerequisites: course.prerequisites || [],
        board: 'main', // SBU goals belong to main board
      };

      try {
        // Try to find existing goal by course ID
        const existing = await pb.collection('goals').getFirstListItem(`title = "${course.title}"`);
        
        // Update existing goal
        await pb.collection('goals').update(existing.id, goalData);
        console.log(`  Updated: ${course.title} (SBU: ${isSBU})`);
        updated++;
      } catch (err: any) {
        if (err.status === 404) {
          // Create new goal
          await pb.collection('goals').create(goalData);
          console.log(`  Created: ${course.title} (SBU: ${isSBU})`);
          created++;
        } else {
          throw err;
        }
      }
    }
    
    console.log('\nSeeding complete!');
    console.log(`  Created: ${created} goals`);
    console.log(`  Updated: ${updated} goals`);
    console.log(`  Total: ${MAKERSPACE_COURSES.length} goals in database`);
    console.log(`  SBU goals (protected): ${SBU_COURSE_IDS.length}`);
    
    return { created, updated, total: MAKERSPACE_COURSES.length };
  } catch (error) {
    console.error('Error seeding goals:', error);
    throw error;
  }
}

// If run directly (not imported)
if (require.main === module) {
  seedSBUGoals()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed:', err);
      process.exit(1);
    });
}

