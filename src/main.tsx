import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Suppress benign Firestore gRPC idle stream disconnection messages from console.error
if (typeof window !== 'undefined' && console && console.error) {
  const origError = console.error;
  console.error = function (...args: any[]) {
    const text = args
      .map((a) => (a && typeof a === 'object' && a.message ? String(a.message) : String(a)))
      .join(' ');
    if (
      text.includes('Disconnecting idle stream') ||
      text.includes('Timed out waiting for new targets') ||
      text.includes('GrpcConnection') ||
      (text.includes('@firebase/firestore') && text.includes('CANCELLED'))
    ) {
      return;
    }
    origError.apply(console, args);
  };
}

// Purge any legacy accommodation register cached state
try {
  localStorage.removeItem('executive_accommodation_register_v1');
} catch {
  // ignore
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="TAMIMI HelpDesk Portal Recovery">
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);


