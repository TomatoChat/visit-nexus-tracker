/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LOGIN_PASSWORD: string;
  // add more env variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
