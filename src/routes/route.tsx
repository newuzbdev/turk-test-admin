import { createBrowserRouter, Navigate } from "react-router-dom";
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
        path: "/",
        element: <Navigate to="/test" replace />,
      },
      {
        path: "/",
        element: <RootLayout />,
        children: [...getAllRoutesForRouter(routerConfig)],
      },
    ],
  },
  {
    path: "/login",
    element: <PublicRoute />,
    children: [
      {
        path: "",
        element: <Login />,
      },
    ],
  },
]);
