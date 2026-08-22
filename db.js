const { Pool } = require('pg');

// Sjekk om vi kobler til en ekstern database (f.eks. Render) eller lokal
const isProduction = process.env.NODE_ENV === 'production';
const isRemoteDb = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Bruk SSL for eksterne databaser (påkrevd av Render PostgreSQL)
    ssl: (isProduction || isRemoteDb)
        ? { rejectUnauthorized: false }
        : false
});

// Auto-opprett tabeller ved oppstart hvis de ikke finnes fra før
async function initDb() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS notes (
            id        BIGSERIAL PRIMARY KEY,
            title     TEXT NOT NULL,
            content   TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS wishes (
            id        BIGSERIAL PRIMARY KEY,
            title     TEXT NOT NULL,
            imdb_url  TEXT NOT NULL,
            rating    TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `);
    // Pass på at rating-kolonnen legges til hvis tabellen allerede finnes fra før
    await pool.query(`
        ALTER TABLE wishes ADD COLUMN IF NOT EXISTS rating TEXT;
    `);
    console.log('Database tables ready.');
}

module.exports = { pool, initDb };

