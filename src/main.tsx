import { createRoot } from 'react-dom/client'
import { injectSpeedInsights } from '@vercel/speed-insights'
import App from '@/App'
import './index.css'

createRoot(document.getElementById("root")!).render(
  <>
    <App />
  </>
);

injectSpeedInsights();
