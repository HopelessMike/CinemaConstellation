# 🌌 Cinema Constellations

<div align="center">
  
  ![Cinema Constellations](https://img.shields.io/badge/version-1.0.0-blue.svg)
  ![Next.js](https://img.shields.io/badge/Next.js-14.2.3-black)
  ![Three.js](https://img.shields.io/badge/Three.js-0.162.0-purple)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
  ![License](https://img.shields.io/badge/license-MIT-green)
  
  <h3>Un Universo Cinematografico Interattivo in 3D</h3>
  
  <p>Esplora migliaia di film come stelle in una galassia tridimensionale, dove ogni film è connesso attraverso generi, temi e similitudini cinematografiche.</p>
  
  [Demo Live](https://cinema-constellations.vercel.app) • [Report Bug](https://github.com/yourusername/cinema-constellations/issues) • [Richiedi Feature](https://github.com/yourusername/cinema-constellations/issues)
  
</div>

---

## ✨ Caratteristiche Principali

### 🎬 Visualizzazione 3D Immersiva
- **5000+ film** rappresentati come stelle interattive nello spazio
- **Clustering intelligente** basato su generi e similitudini cinematografiche
- **Navigazione fluida** con controlli orbit intuitivi
- **Effetti visivi spettacolari** con animazioni e transizioni fluide

### 🤖 Intelligenza Artificiale
- **Analisi AI delle similitudini** tra film con LLM
- **Caching intelligente** per ottimizzare le performance
- **Suggerimenti personalizzati** basati sulle connessioni cinematografiche

### ⚡ Performance Ottimizzate
- **Level of Detail (LOD)** dinamico che si adatta alle prestazioni
- **Frustum Culling** per renderizzare solo elementi visibili
- **Lazy Loading** progressivo dei dati
- **60 FPS target** con adattamento automatico della qualità

### 📱 Multipiattaforma
- **Responsive Design** per desktop, tablet e mobile
- **Touch Controls** ottimizzati per dispositivi mobili
- **Fullscreen Mode** per esperienza immersiva
- **Cursore spaziale personalizzato** su desktop

---

## 🚀 Quick Start

### Prerequisiti

- Node.js 18.0 o superiore
- npm o yarn
- Account Vercel (opzionale per deployment)
- API Key OpenAI (opzionale per analisi AI)

### Installazione

1. **Clona il repository**
```bash
git clone https://github.com/yourusername/cinema-constellations.git
cd cinema-constellations
```

2. **Installa le dipendenze**
```bash
npm install
# o
yarn install
```

3. **Configura le variabili d'ambiente**
```bash
cp .env.example .env.local
```

Modifica `.env.local`:
```env
# OpenAI API (opzionale)
OPENAI_API_KEY=sk-...

# Supabase (opzionale per caching)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

4. **Aggiungi i dati dei film**

Inserisci il file `movie-data.json` nella cartella `public/`:
```json
[
  {
    "id": 19995,
    "title": "Avatar",
    "overview": "Descrizione...",
    "genres": ["Azione", "Avventura"],
    "poster_path": "https://...",
    "x": 4.45,
    "y": 7.19,
    "z": 4.63,
    "cluster_id": 43,
    "neighbor_ids": [285, 206647],
    "release_year": 2009,
    "duration": 162,
    "rating": 7.592,
    "director": "James Cameron"
  }
]
```

5. **Avvia il server di sviluppo**
```bash
npm run dev
# o
yarn dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

---

## 📁 Struttura del Progetto

```
cinema-constellations/
├── app/
│   ├── api/
│   │   ├── movies/          # API per caricamento film
│   │   └── llm-analysis/    # API analisi AI
│   ├── components/
│   │   ├── StarField.tsx    # Campo stellare 3D principale
│   │   ├── Star.tsx         # Componente stella/film
│   │   ├── ClusterSphere.tsx # Visualizzazione cluster
│   │   ├── SpaceCursor.tsx  # Cursore spaziale custom
│   │   ├── LoadingScreen.tsx # Schermata caricamento
│   │   └── MovieDetailsDialog.tsx # Dettagli film
│   ├── page.tsx             # Pagina principale
│   ├── layout.tsx           # Layout app
│   └── globals.css          # Stili globali
├── lib/
│   ├── movieStore.ts        # State management
│   ├── types.ts             # TypeScript types
│   ├── utils.ts             # Utility functions
│   └── db.ts                # Database helpers
├── public/
│   ├── movie-data.json      # Dataset film
│   └── Cinema-Avatar.png    # Logo app
└── package.json
```

---

## 🎮 Controlli

### Desktop
- **🖱️ Drag sinistro**: Orbita attorno all'universo
- **📜 Scroll**: Zoom in/out
- **🖱️ Drag destro**: Pan della camera
- **🎯 Click su stella**: Apri dettagli film
- **🔍 Hover su stella**: Mostra titolo

### Mobile
- **👆 Un dito**: Ruota camera
- **🤏 Pizzica**: Zoom in/out
- **👆👆 Due dita drag**: Pan camera
- **📱 Tap su stella**: Apri dettagli

---

## 🔧 Configurazione Avanzata

### Database Supabase

Per abilitare il caching delle analisi AI:

1. **Crea database su Vercel**
```bash
vercel postgres create cinema-cache
```

2. **Inizializza tabelle**
```bash
npm run db:init
```

### Integrazione OpenAI

1. Ottieni API key da [platform.openai.com](https://platform.openai.com)
2. Aggiungi in `.env.local`:
```env
OPENAI_API_KEY=sk-your-key
```

### Personalizzazione

#### Colori per Genere
Modifica `lib/movieStore.ts`:
```typescript
const colorMap = {
  'Azione': '#ff6b6b',
  'Commedia': '#ffe66d',
  // Aggiungi altri...
}
```

#### Performance Tuning
In `components/StarField.tsx`:
```typescript
const getMaxStarsToRender = () => {
  switch (levelOfDetail) {
    case 'low': return 300
    case 'medium': return 600
    default: return 1000
  }
}
```

---

## 📊 Scripts Disponibili

```bash
npm run dev          # Avvia server sviluppo
npm run build        # Build produzione
npm run start        # Avvia produzione
npm run lint         # Linting codice
npm run type-check   # Verifica TypeScript
npm run db:init      # Inizializza database
```

---

## 🚀 Deployment

### Vercel (Consigliato)

1. **Installa Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
vercel
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🤝 Contributing

Contribuzioni sono benvenute! Per contribuire:

1. Fork il progetto
2. Crea un branch (`git checkout -b feature/AmazingFeature`)
3. Commit modifiche (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri Pull Request

### Linee Guida

- Segui lo stile di codice esistente
- Aggiungi test per nuove features
- Aggiorna documentazione se necessario
- Assicurati che il build passi

---

## 📈 Performance

### Metriche Target
- **FPS**: 60 (desktop), 30+ (mobile)
- **Time to Interactive**: < 3s
- **Lighthouse Score**: 90+
- **Bundle Size**: < 500KB gzipped

### Ottimizzazioni Implementate
- ✅ Dynamic Level of Detail (LOD)
- ✅ Frustum Culling
- ✅ Lazy Loading
- ✅ Texture Atlasing
- ✅ Instance Rendering
- ✅ Worker Threads per calcoli pesanti

---

## 🐛 Troubleshooting

### Problema: Performance lenta
- Riduci numero stelle visibili in `StarField.tsx`
- Disabilita effetti particelle nelle impostazioni
- Usa Chrome/Edge per migliori performance WebGL

### Problema: Film non caricano
- Verifica che `movie-data.json` sia in `public/`
- Controlla formato JSON sia valido
- Verifica console per errori

### Problema: Analisi AI non funziona
- Verifica API key OpenAI in `.env.local`
- Controlla limiti rate API
- Sistema ha fallback automatici

---

## 📝 Licenza

Distribuito sotto licenza MIT. Vedi `LICENSE` per maggiori informazioni.

---

## 👥 Team

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/yourusername">
        <img src="https://github.com/yourusername.png" width="100px;" alt=""/>
        <br />
        <sub><b>Your Name</b></sub>
      </a>
      <br />
      <a href="#" title="Code">💻</a>
      <a href="#" title="Design">🎨</a>
    </td>
  </tr>
</table>

---

## 🙏 Acknowledgments

- [Three.js](https://threejs.org/) - Grafica 3D
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/) - React renderer per Three.js
- [Next.js](https://nextjs.org/) - React framework
- [Vercel](https://vercel.com/) - Hosting e deployment
- [OpenAI](https://openai.com/) - API per analisi AI
- [Supabase](https://supabase.com/) - Database e backend

---

<div align="center">
  
  **[⬆ Torna su](#-cinema-constellations)**
  
  Made with ❤️ and ☕ in Italy 🇮🇹
  
</div>
