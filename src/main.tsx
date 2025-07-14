import { createRoot } from 'react-dom/client'
import App from '@/App'
import './index.css'
import { initializeSpeedInsights } from '@/lib/performance'
import { ThemeProvider } from 'next-themes'

// Initialize comprehensive performance monitoring
initializeSpeedInsights();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <App />
  </ThemeProvider>
);
