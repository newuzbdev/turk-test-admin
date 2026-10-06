import { createRoot } from "react-dom/client";

import { ThemeProvider } from "./providers/theme-provider";
import { QueryProvider } from "./providers/query-provider";
import { AntProvider } from "./providers/ant-provider";
import { RouterProviders } from "./providers/router-provider";
import "./global.css";
import { installMediaProtection } from "./utils/mediaProtection";
import { installAntdReact19Renderer } from "./providers/antd-react19-renderer";

installAntdReact19Renderer();
installMediaProtection();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <QueryProvider>
      <AntProvider>
        <RouterProviders />
      </AntProvider>
    </QueryProvider>
  </ThemeProvider>
);
