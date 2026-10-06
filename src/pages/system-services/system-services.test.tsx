import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import SystemServices from "./system-services";
const { state, refetch } = vi.hoisted(() => ({
  state: { isPending: false, isError: false, isFetching: false },
  refetch: vi.fn(),
}));
vi.mock("@/config/queries/system-services", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/config/queries/system-services")
  >()),
  useSystemServices: () => ({
    ...state,
    refetch,
    data: {
      environment: "development",
      checkedAt: "2026-09-13T10:00:00Z",
      items: [
        {
          id: "deepgram",
          name: "Sesi metne çevirme",
          provider: "Deepgram",
          category: "ai",
          status: "configured",
          purpose: "Ses kaydını yazıya çevirir.",
          usedIn: "Konuşma kayıtları",
          detail: "Puan vermez.",
          model: "nova-3",
        },
        {
          id: "google",
          name: "Google ile giriş",
          provider: "Google",
          category: "access",
          status: "missing",
          purpose: "Oturum açar.",
          usedIn: "Giriş sayfası",
          detail: "Ayrı bağlantı.",
        },
      ],
    },
  }),
}));
afterEach(() => {
  cleanup();
  state.isPending = false;
  state.isError = false;
  refetch.mockClear();
});
const mount = () =>
  render(
    <MemoryRouter>
      <SystemServices />
    </MemoryRouter>,
  );
describe("service inventory", () => {
  it("explains configuration without claiming a live connection and filters by category", () => {
    mount();
    expect(screen.getByText("Ayarlar mevcut")).toBeInTheDocument();
    expect(screen.getByText("Ayar eksik")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Giriş" }));
    expect(
      screen.getByRole("heading", { name: "Google ile giriş" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Sesi metne çevirme" }),
    ).not.toBeInTheDocument();
  });
  it("searches model names, opens details and refreshes settings only on request", () => {
    mount();
    fireEvent.change(screen.getByRole("textbox", { name: "Servis ara" }), {
      target: { value: "nova-3" },
    });
    expect(
      screen.getByRole("heading", { name: "Sesi metne çevirme" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Google ile giriş" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Ayrıntı"));
    expect(screen.getByText("Puan vermez.").closest("details")).toHaveAttribute(
      "open",
    );
    fireEvent.click(screen.getByRole("button", { name: "Yenile" }));
    expect(refetch).toHaveBeenCalledOnce();
  });
  it("does not present stale statuses as current when refresh fails", () => {
    state.isError = true;
    mount();
    expect(screen.getByText("Servis bilgileri alınamadı")).toBeInTheDocument();
    expect(screen.queryByText("Ayarlar mevcut")).not.toBeInTheDocument();
  });
  it("has distinct loading and no-match states", () => {
    state.isPending = true;
    const view = mount();
    expect(screen.queryByText("Ayarlar mevcut")).not.toBeInTheDocument();
    state.isPending = false;
    view.rerender(
      <MemoryRouter>
        <SystemServices />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Servis ara" }), {
      target: { value: "bulunmayan" },
    });
    expect(
      screen.getByText("Bu aramaya uygun servis bulunamadı."),
    ).toBeInTheDocument();
  });
});
