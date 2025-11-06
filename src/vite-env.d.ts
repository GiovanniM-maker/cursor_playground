/// <reference types="vite/client" />

// Estendi ImportMetaEnv per le variabili d'ambiente personalizzate
// Vite già fornisce ImportMeta e ImportMetaEnv, qui aggiungiamo solo le nostre variabili
declare global {
  interface ImportMetaEnv {
    readonly VITE_API_URL?: string
  }
}

