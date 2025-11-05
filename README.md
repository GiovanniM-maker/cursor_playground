# Chat App with AI Models

App React + Vite con integrazione di modelli AI (Gemini, NANOBANANA, Imagen).

## Setup

1. Installa le dipendenze:
```bash
npm install
```

2. Crea il file `.env` nella root:
```env
GOOGLE_CLOUD_API_KEY=your_api_key_here
```

3. Avvia backend + frontend:
```bash
npm run dev:full
```

Oppure separatamente:
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run dev
```

## Configurazione

- Le API keys sono gestite lato backend (sicurezza)
- Il backend è su `http://localhost:3001` (configurabile con `PORT`)
- Il frontend si connette automaticamente al backend

## Modelli supportati

- **NANOBANANA**: Gemini 2.5 Flash Image
- **Gemini 2.5 Flash Preview**: Generazione testo e immagini
- **Imagen**: (da implementare)

## Deploy

Il progetto è configurato per GitHub Pages. Il backend dovrà essere deployato separatamente (es. Vercel, Railway, Render).

