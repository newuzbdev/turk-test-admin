import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './global.css';
import 'antd/dist/reset.css';
import { AntProvider } from './providers/ant-provider';
import { RouterProviders } from './providers/router-provider';
import { ThemeProvider } from './providers/theme-provider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AntProvider>
        <RouterProviders />
      </AntProvider>
    </ThemeProvider>
  </StrictMode>
);