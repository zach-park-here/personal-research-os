import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { DarkModeProvider } from './contexts/DarkModeContext';
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://db186da6ad5db319c69b0c3260ada65f@o4510656311263232.ingest.us.sentry.io/4510656324763648",
  tracesSampleRate: 1.0,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DarkModeProvider>
      <App />
    </DarkModeProvider>
  </React.StrictMode>
);
