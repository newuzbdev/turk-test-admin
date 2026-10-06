import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RootLayout from "./layout";
import { ThemeContext } from "../../providers/theme-provider";
const { logout, toggleMode } = vi.hoisted(() => ({
  logout: vi.fn(),
  toggleMode: vi.fn(),
}));
vi.mock("../../providers/auth-provider", () => ({
  useAuth: () => ({ setAuthenticated: vi.fn() }),
}));
vi.mock("../../config/queries/login-querys", () => ({
  useAdminLogout: () => ({ mutate: logout, isPending: false }),
}));
vi.mock("../../routes/router-config", () => ({
  routerConfig: [
    { path: "learn", label: "Dersler", icon: <span />, inMenu: true },
    {
      path: "learn/skill-tags",
      label: "Beceri etiketleri",
      icon: <span />,
      inMenu: true,
    },
    { path: "test", label: "Tam denemeler", icon: <span />, inMenu: true },
    {
      path: "system-services",
      label: "Servisler ve yapay zekâ",
      icon: <span />,
      inMenu: true,
    },
  ],
}));
beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
function mount(path = "/test") {
  return render(
    <ThemeContext.Provider value={{ theme: "light", toggleMode }}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="*" element={<h1>Çalışma alanı</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeContext.Provider>,
  );
}
it("collapses and reopens from the sidebar while keeping navigation accessible", () => {
  mount();
  fireEvent.click(screen.getByRole("button", { name: "Menüyü daralt" }));
  expect(localStorage.getItem("admin-sidebar-collapsed")).toBe("true");
  expect(screen.getByRole("link", { name: "Dersler" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Menüyü genişlet" }));
  expect(localStorage.getItem("admin-sidebar-collapsed")).toBe("false");
  expect(screen.getAllByRole("heading")).toHaveLength(1);
});
it("marks the specific nested page, not its parent, as selected", () => {
  mount("/learn/skill-tags");
  expect(
    screen.getByRole("link", { name: "Beceri etiketleri" }),
  ).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Dersler" })).not.toHaveAttribute(
    "aria-current",
  );
});
it("keeps theme and logout actions in the menu and never logs out on cancellation", async () => {
  mount();
  expect(
    screen.queryByRole("menuitem", { name: "Koyu tema" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Yönetici menüsü" }));
  fireEvent.click(await screen.findByRole("menuitem", { name: "Koyu tema" }));
  expect(toggleMode).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole("button", { name: "Yönetici menüsü" }));
  fireEvent.click(await screen.findByRole("menuitem", { name: "Çıkış yap" }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Vazgeç" }));
  expect(logout).not.toHaveBeenCalled();
});

it("collapses groups independently and remembers their state", () => {
  mount();
  fireEvent.click(screen.getByRole("button", { name: "Dersler" }));
  expect(
    screen.queryByRole("link", { name: "Beceri etiketleri" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Tam denemeler" }),
  ).toBeInTheDocument();
  expect(
    JSON.parse(localStorage.getItem("admin-sidebar-groups") || "{}")["Dersler"],
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Dersler" }));
  expect(
    screen.getByRole("link", { name: "Beceri etiketleri" }),
  ).toBeInTheDocument();
});
