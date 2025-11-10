# Chat App with AI Models

App React + Vite con integrazione di modelli AI (Gemini, NANOBANANA, Imagen).

## Setup

1. Installa le dipendenze:
```bash
npm install
```

2. Crea il file `.env` nella root con le credenziali del service account Google Cloud:
```env
GOOGLE_PROJECT_ID=eataly-creative-ai-suite
GOOGLE_LOCATION=us-central1
GOOGLE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
# Ricorda di sostituire \n con newline reali
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
VITE_API_URL=http://localhost:3001
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

- Le credenziali del service account sono gestite lato backend
- Il backend gira su `http://localhost:3001` (configurabile con `PORT`)
- Il frontend usa `VITE_API_URL` per puntare al backend

## Modelli supportati

- **NANOBANANA**: Gemini 2.5 Flash Image
- **Gemini 2.5 Flash Preview**: Generazione testo e immagini
- **Imagen**: generazione di immagini (imagegeneration@005)

## Deploy

Il progetto è configurato per GitHub Pages. Il backend dovrà essere deployato separatamente (es. Vercel, Railway, Render).

