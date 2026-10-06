import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { expect, it, vi } from "vitest";
import { PublicRoute } from "./guards";
vi.mock("../providers/auth-provider", () => ({
  useAuth: () => ({ isAuthenticated: true, checkAuthStatus: vi.fn() }),
}));
function Destination() {
  const location = useLocation();
  return <output>{location.pathname + location.search + location.hash}</output>;
}
it("keeps archive filters, pagination and anchor when returning after auth", () => {
  render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/login",
          state: {
            from: {
              pathname: "/test",
              search: "?view=ARCHIVED&page=2",
              hash: "#list",
            },
          },
        },
      ]}
    >
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<p>Login</p>} />
        </Route>
        <Route path="/test" element={<Destination />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(
    screen.getByText("/test?view=ARCHIVED&page=2#list"),
  ).toBeInTheDocument();
});
