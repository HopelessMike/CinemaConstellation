// app/api/llm-analysis/route.ts
import { NextRequest } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export const runtime = 'edge';

type Movie = { id: number; title: string };

const openai = createOpenAI();

// Cache in-memory dei film per la vita del processo
let moviesCache: Movie[] | null = null;

async function getMovieData(request: NextRequest): Promise<Movie[] | null> {
  if (moviesCache) return moviesCache;
  try {
    // URL relativo all’host corrente (robusto in Edge/Prod)
    const url = new URL('/api/movies', request.url);
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const movies = (await res.json()) as Movie[];
    if (!Array.isArray(movies)) return null;
    moviesCache = movies;
    return movies;
  } catch {
    return null;
  }
}

function findTitles(all: Movie[], id1: number, id2: number) {
  const title1 = all.find((m) => m.id === id1)?.title;
  const title2 = all.find((m) => m.id === id2)?.title;
  return title1 && title2 ? { title1, title2 } : null;
}

async function saveToCache(movie1Id: number, movie2Id: number, analysis: string) {
  try {
    const supabase = createClient();
    await supabase
      .from('llm_analysis_cache')
      .upsert(
        { movie1_id: movie1Id, movie2_id: movie2Id, analysis },
        { onConflict: 'movie1_id,movie2_id' },
      );
  } catch {
    // non bloccare la risposta in caso di errore di cache
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const movie1Id = Number(body?.movie1Id);
    const movie2Id = Number(body?.movie2Id);
    if (!Number.isFinite(movie1Id) || !Number.isFinite(movie2Id)) {
      return new Response('Both movie1Id and movie2Id (numbers) are required', { status: 400 });
    }

    // Ordine deterministico per la cache
    const [id1, id2] = movie1Id < movie2Id ? [movie1Id, movie2Id] : [movie2Id, movie1Id];

    // Cache → rispondi subito (testo puro, coerente con lo stream)
    try {
      const supabase = createClient();
      const { data: cached } = await supabase
        .from('llm_analysis_cache')
        .select('analysis')
        .eq('movie1_id', id1)
        .eq('movie2_id', id2)
        .maybeSingle();
      if (cached?.analysis) {
        return new Response(cached.analysis, {
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        });
      }
    } catch {
      // prosegui senza cache
    }

    // Dati film
    const movies = await getMovieData(request);
    if (!movies) return new Response('Unable to load movie dataset', { status: 502 });

    const titles = findTitles(movies, id1, id2);
    if (!titles) {
      return new Response('Movie titles not found for the provided IDs', { status: 404 });
    }
    const { title1, title2 } = titles;

    // Istruzioni concise e rigorose (niente sentinelle)
    const system = `Sei 'Enea Vessella', critico e saggista italiano.
Stile: colto ma chiaro, essenziale, senza riassunti prolissi né frasi fatte.
Regole di lunghezza (rigorose):
- Esattamente 3 paragrafi.
- Massimo 2 frasi per paragrafo.
- Massimo ~90 parole totali.
Preferisci frasi brevi (≤ 20 parole), verbi concreti, niente elenchi puntati o conclusioni generiche.
Focalizzati solo su: temi, atmosfera/stile, struttura/archetipi, eventuale contesto culturale se davvero necessario.`;

    const user = `Confronta sinteticamente i film "${title1}" e "${title2}" spiegando perché risultano vicini nel nostro universo cinematografico 3D.`;

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      // Più “sobrio” nelle scelte verbali
      temperature: 0.5,

      // Abbassiamo il cap: sufficiente per 4 frasi ben formate
      maxOutputTokens: 220,

      system,
      prompt: user,

      onFinish: async ({ text }) => {
        // Salva il testo finale (già privo di sentinelle)
        await saveToCache(id1, id2, text.trim());
      },
    });

    // Stream testuale
    return result.toTextStreamResponse();
  } catch {
    return new Response('An unexpected error occurred', { status: 500 });
  }
}
