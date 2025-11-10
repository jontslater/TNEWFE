/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_USE_MOCK: string
  readonly VITE_FIREBASE_API_KEY: string
  // add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
