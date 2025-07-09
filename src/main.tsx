import { createRoot } from 'react-dom/client'
import { SpeedInsights } from '@vercel/speed-insights'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <SpeedInsights />
  </>
);
