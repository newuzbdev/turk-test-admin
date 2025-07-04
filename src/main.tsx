import { createRoot } from "react-dom/client";

import "./global.css";
import { ThemeProvider } from "./providers/theme-provider";
import { QueryProvider } from "./providers/query-provider";
import { AntProvider } from "./providers/ant-provider";
import { RouterProviders } from "./providers/router-provider";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <QueryProvider>
      <AntProvider>
        <RouterProviders />
      </AntProvider>
    </QueryProvider>
  </ThemeProvider>
);
