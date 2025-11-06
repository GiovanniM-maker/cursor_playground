/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  // più variabili d'ambiente qui se necessario
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

