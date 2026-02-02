/**
 * Database seeder for sample apps
 * Run with: npx tsx scripts/seed-apps.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '../src/lib/db';
import { apps } from '../src/lib/db/schema';

const sampleApps = [
  {
    slug: 'timesheets',
    name: 'Timesheets',
    description: 'Track and submit your work hours',
    iconUrl: null,
    appUrl: 'https://timesheets.renewalinitiatives.org',
  },
  {
    slug: 'proposal-rodeo',
    name: 'Proposal Rodeo',
    description: 'Manage grant proposals and submissions',
    iconUrl: null,
    appUrl: 'https://proposals.renewalinitiatives.org',
  },
];

async function seed() {
  console.log('Seeding apps...');

  for (const app of sampleApps) {
    try {
      await db.insert(apps).values(app).onConflictDoNothing();
      console.log(`  + ${app.name}`);
    } catch (error) {
      console.error(`  ! Failed to seed ${app.name}:`, error);
    }
  }

  console.log('Done!');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
