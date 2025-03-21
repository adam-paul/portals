import { neon } from '@neondatabase/serverless';

// In Vite, environment variables are accessed via import.meta.env
const sql = neon(import.meta.env.VITE_DATABASE_URL || '');

export default sql;