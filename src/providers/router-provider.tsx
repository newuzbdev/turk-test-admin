import { RouterProvider } from "react-router";
import { router } from "../routes/route";
import { AuthProvider } from "./auth-provider";

export function RouterProviders() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
