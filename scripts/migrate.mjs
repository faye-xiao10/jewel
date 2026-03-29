import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'

const url = process.env.DATABASE_URL
if (!url) { console.error('DATABASE_URL not set'); process.exit(1) }

const sql = neon(url)
const migration = readFileSync(new URL('../drizzle/migrations/0001_gifted_elektra.sql', import.meta.url), 'utf8')
const statements = migration.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean)

for (const stmt of statements) {
  console.log('Running:', stmt)
  try {
    await sql.query(stmt)
    console.log('OK')
  } catch (e) {
    if (String(e).includes('already exists') || String(e).includes('duplicate column')) {
      console.log('Already applied, skipping')
    } else {
      console.error('Error:', e)
      process.exit(1)
    }
  }
}
console.log('Migration complete')
