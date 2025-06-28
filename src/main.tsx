import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './global.css';
import 'antd/dist/reset.css';
import { AntProvider } from './providers/ant-provider';
import { RouterProviders } from './providers/router-provider';
import { ThemeProvider } from './providers/theme-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient()
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AntProvider>
          <RouterProviders />
        </AntProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);