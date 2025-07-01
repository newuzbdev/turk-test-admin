import { createBrowserRouter } from "react-router-dom";
import { Login } from "./lazy-pages";
import RootLayout from "../components/layout/layout";
import { ProtectedRoute, PublicRoute } from "./guards";
import { getAllRoutesForRouter } from "./get-all-routes";
import { routerConfig } from "./router-config";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        path: "",
        element: <RootLayout />,
        children: [...getAllRoutesForRouter(routerConfig)],
      },
    ],
  },
  {
    path: "/",
    element: <PublicRoute />,
    children: [{ path: "login", element: <Login /> }],
  },
]);
