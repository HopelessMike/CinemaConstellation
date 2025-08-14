#!/usr/bin/env node
// scripts/init-db.mjs
// Esegui con: node scripts/init-db.mjs

import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';

// Carica le variabili d'ambiente
dotenv.config({ path: '.env.local' });

async function initializeDatabase() {
  console.log('🚀 Inizializzazione database Cinema Constellations...\n');
  
  try {
    // Verifica connessione
    console.log('📡 Verifica connessione al database...');
    const testConnection = await sql`SELECT NOW()`;
    console.log('✅ Connesso al database Vercel Postgres\n');
    
    // Crea tabella principale
    console.log('📊 Creazione tabella llm_analysis_cache...');
    await sql`
      CREATE TABLE IF NOT EXISTS llm_analysis_cache (
        id SERIAL PRIMARY KEY,
        movie1_id INTEGER NOT NULL,
        movie2_id INTEGER NOT NULL,
        analysis TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_movie_pair UNIQUE(movie1_id, movie2_id),
        CONSTRAINT check_movie_order CHECK (movie1_id < movie2_id)
      )
    `;
    console.log('✅ Tabella llm_analysis_cache creata\n');
    
    // Crea indici per performance
    console.log('🔍 Creazione indici per ottimizzazione query...');
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_movie_pairs 
      ON llm_analysis_cache(movie1_id, movie2_id)
    `;
    console.log('  ✓ Indice idx_movie_pairs creato');
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_created_at 
      ON llm_analysis_cache(created_at DESC)
    `;
    console.log('  ✓ Indice idx_created_at creato');
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_movie1_id 
      ON llm_analysis_cache(movie1_id)
    `;
    console.log('  ✓ Indice idx_movie1_id creato');
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_movie2_id 
      ON llm_analysis_cache(movie2_id)
    `;
    console.log('  ✓ Indice idx_movie2_id creato\n');
    
    // Crea trigger per aggiornare updated_at
    console.log('⚡ Creazione trigger per updated_at...');
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;
    
    await sql`
      DROP TRIGGER IF EXISTS update_llm_analysis_cache_updated_at 
      ON llm_analysis_cache
    `;
    
    await sql`
      CREATE TRIGGER update_llm_analysis_cache_updated_at 
      BEFORE UPDATE ON llm_analysis_cache 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column()
    `;
    console.log('✅ Trigger created\n');
    
    // Verifica stato del database
    console.log('📈 Statistiche database:');
    const stats = await sql`
      SELECT 
        COUNT(*) as total_entries,
        pg_size_pretty(pg_relation_size('llm_analysis_cache')) as table_size
      FROM llm_analysis_cache
    `;
    
    const { total_entries, table_size } = stats.rows[0];
    console.log(`  • Totale analisi salvate: ${total_entries}`);
    console.log(`  • Dimensione tabella: ${table_size}\n`);
    
    // Crea tabella di log (opzionale)
    console.log('📝 Creazione tabella di log (opzionale)...');
    await sql`
      CREATE TABLE IF NOT EXISTS analysis_logs (
        id SERIAL PRIMARY KEY,
        movie1_id INTEGER NOT NULL,
        movie2_id INTEGER NOT NULL,
        request_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        response_time INTEGER, -- milliseconds
        cache_hit BOOLEAN DEFAULT FALSE,
        error_message TEXT
      )
    `;
    console.log('✅ Tabella analysis_logs creata\n');
    
    // Test inserimento e recupero
    console.log('🧪 Test funzionalità database...');
    
    // Test insert
    const testMovie1Id = 1;
    const testMovie2Id = 2;
    const testAnalysis = 'Test analysis for database initialization';
    
    await sql`
      INSERT INTO llm_analysis_cache (movie1_id, movie2_id, analysis)
      VALUES (${testMovie1Id}, ${testMovie2Id}, ${testAnalysis})
      ON CONFLICT (movie1_id, movie2_id) 
      DO UPDATE SET
        analysis = ${testAnalysis},
        updated_at = CURRENT_TIMESTAMP
    `;
    console.log('  ✓ Test inserimento completato');
    
    // Test select
    const testResult = await sql`
      SELECT analysis FROM llm_analysis_cache
      WHERE movie1_id = ${testMovie1Id} AND movie2_id = ${testMovie2Id}
    `;
    
    if (testResult.rows.length > 0 && testResult.rows[0].analysis === testAnalysis) {
      console.log('  ✓ Test recupero dati completato');
    } else {
      throw new Error('Test recupero dati fallito');
    }
    
    // Cleanup test data
    await sql`
      DELETE FROM llm_analysis_cache 
      WHERE movie1_id = ${testMovie1Id} AND movie2_id = ${testMovie2Id}
    `;
    console.log('  ✓ Pulizia dati di test completata\n');
    
    console.log('🎉 Database inizializzato con successo!');
    console.log('');
    console.log('📌 Prossimi passi:');
    console.log('  1. Verifica che il file .env.local contenga le credenziali del database');
    console.log('  2. Avvia il progetto con: npm run dev');
    console.log('  3. Le analisi LLM verranno automaticamente salvate nel database');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Errore durante l\'inizializzazione del database:');
    console.error(error);
    
    console.log('\n🔧 Suggerimenti per risolvere:');
    console.log('  1. Verifica di aver creato il database su Vercel');
    console.log('  2. Assicurati che .env.local contenga POSTGRES_URL');
    console.log('  3. Esegui: vercel env pull .env.local');
    console.log('  4. Riprova con: node scripts/init-db.mjs');
    
    process.exit(1);
  }
}

// Esegui inizializzazione
initializeDatabase();