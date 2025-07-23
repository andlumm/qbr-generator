import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'
import * as dotenv from 'dotenv'

// Ensure this module only runs on the server
if (typeof window !== 'undefined') {
  throw new Error('Database module cannot be imported on the client side')
}

// Load environment variables from .env.local for non-Next.js contexts
if (!process.env.VERCEL) {
  dotenv.config({ path: '.env.local' })
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

// Create the connection
const sql = neon(process.env.DATABASE_URL)

// Create the database instance with schema
export const db = drizzle(sql, { schema })

// Export schema for use in queries
export * from './schema'