/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LOGIN_PASSWORD: string;
  readonly VITE_GOOGLE_MAPS_KEY: string;
  // add more env variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
