import { createRoot } from 'react-dom/client'
import App from '@/App'
import './index.css'
import { initializeSpeedInsights } from '@/lib/performance'

// Initialize comprehensive performance monitoring
initializeSpeedInsights();

createRoot(document.getElementById("root")!).render(
  <>
    <App />
  </>
);
