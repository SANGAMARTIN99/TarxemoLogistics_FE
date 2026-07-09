import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { Toaster } from 'react-hot-toast';
import './index.css';
import i18n from './i18n';
import App from './App';
import { apolloClient } from './api/apolloClient';
import { useAppStore } from './store/useAppStore';

function Root() {
  const { theme, language } = useAppStore();
  
  if (theme === 'dark') document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  return (
    <>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#E8580A', secondary: '#fff' } },
        }}
      />
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApolloProvider client={apolloClient}>
      <BrowserRouter>
        <Root />
      </BrowserRouter>
    </ApolloProvider>
  </StrictMode>,
);
