/**
 * One-time migration: encrypt existing plaintext PII fields in the employees table.
 *
 * Run with: npx tsx scripts/encrypt-existing-pii.ts
 *
 * IMPORTANT: Run this BEFORE deploying the new decrypt-on-read code.
 * The script is idempotent — already-encrypted values (iv:authTag:ciphertext format)
 * are skipped automatically.
 *
 * Requires PAYROLL_ENCRYPTION_KEY in .env.local (64 hex chars = 32 bytes).
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '../src/lib/db';
import { employees } from '../src/lib/db/schema';
import { encryptPII, decryptPII } from '../src/lib/encryption';

const PII_COLUMNS = ['taxId', 'stateTaxId', 'address'] as const;

function isAlreadyEncrypted(value: string): boolean {
  const parts = value.split(':');
  if (parts.length !== 3) return false;
  // Check that all three parts are valid base64
  try {
    for (const part of parts) {
      const buf = Buffer.from(part, 'base64');
      // Re-encode and compare to verify it's real base64, not just a colon-separated string
      if (buf.toString('base64') !== part) return false;
    }
    // Final check: try to decrypt it — if it works, it's already encrypted
    decryptPII(value);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  // Verify encryption key is available
  if (!process.env.PAYROLL_ENCRYPTION_KEY) {
    console.error('ERROR: PAYROLL_ENCRYPTION_KEY not set in .env.local');
    process.exit(1);
  }

  console.log('Fetching all employees...');
  const allEmployees = await db.select().from(employees);
  console.log(`Found ${allEmployees.length} employee(s).`);

  let updated = 0;
  let skipped = 0;

  for (const emp of allEmployees) {
    const updates: Record<string, string> = {};
    let needsUpdate = false;

    for (const col of PII_COLUMNS) {
      const value = emp[col];
      if (value == null || value === '') {
        continue;
      }
      if (isAlreadyEncrypted(value)) {
        console.log(`  [SKIP] ${emp.name} → ${col} already encrypted`);
        skipped++;
        continue;
      }
      updates[col] = encryptPII(value);
      needsUpdate = true;
      console.log(`  [ENCRYPT] ${emp.name} → ${col} (${value.length} chars → encrypted)`);
    }

    if (needsUpdate) {
      const { eq } = await import('drizzle-orm');
      await db
        .update(employees)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(employees.id, emp.id));
      updated++;
    }
  }

  console.log(`\nDone. ${updated} employee(s) updated, ${skipped} field(s) already encrypted.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
