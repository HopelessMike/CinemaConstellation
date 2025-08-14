// scripts/init-supabase.mjs
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carica variabili d'ambiente
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Mancano le credenziali Supabase!')
  console.log('Assicurati di avere NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function initDatabase() {
  console.log('🚀 Inizializzazione database Supabase...')
  
  try {
    // Crea tabella per cache analisi LLM
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS llm_analysis_cache (
          id SERIAL PRIMARY KEY,
          movie1_id INTEGER NOT NULL,
          movie2_id INTEGER NOT NULL,
          analysis TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT unique_movie_pair UNIQUE(movie1_id, movie2_id),
          CONSTRAINT check_movie_order CHECK (movie1_id < movie2_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_movie_pairs 
        ON llm_analysis_cache(movie1_id, movie2_id);
        
        CREATE INDEX IF NOT EXISTS idx_created_at 
        ON llm_analysis_cache(created_at DESC);
      `
    })
    
    if (tableError) throw tableError
    
    console.log('✅ Database inizializzato con successo!')
    
  } catch (error) {
    console.error('❌ Errore:', error)
    process.exit(1)
  }
}

initDatabase()