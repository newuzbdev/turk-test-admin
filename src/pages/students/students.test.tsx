import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import { studentQueryKey } from "@/config/queries/students";
import Students from "./students";
const accountId = "f3245f75-7cf6-42f4-9d28-4cfa415f5624";
const originalExecCommand = Object.getOwnPropertyDescriptor(
  document,
  "execCommand",
);
function AccountManagement() {
  return <h1>Hesap yönetimi: {useParams().id}</h1>;
}
const mocks = vi.hoisted(() => ({
  enabled: true,
  error: false,
  refetch: vi.fn(),
  filters: vi.fn(),
}));
vi.mock("@/config/queries/students", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useStudents: (filters: object) => {
    mocks.filters(filters);
    return {
      data: {
        items: [
          {
            id: "f3245f75-7cf6-42f4-9d28-4cfa415f5624",
            name: "Ada",
            email: "ada@example.test",
            telegramUsername: "ada",
            telegramId: null,
            createdAt: "2026-10-13T04:20:00Z", membership: "ACTIVE", signupMethod:"GOOGLE", registrationOrigin:{countryCode:"UZ",city:"Tashkent",source:"INSTAGRAM",medium:"PAID",campaign:"launch_01",capturedAt:"2026-10-13T04:20:00Z"},
          },
        ],
        total: 60,
      },
      isError: mocks.error,
      refetch: mocks.refetch,
    };
  },
}));
vi.mock("@/config/queries/access", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useAccessConfig: () => ({
    data: { enabled: mocks.enabled },
    refetch: mocks.refetch,
  }),
}));
beforeEach(() => {
  mocks.enabled = true;
  mocks.error = false;
  mocks.filters.mockReset();
  const original = window.getComputedStyle;
  vi.spyOn(window, "getComputedStyle").mockImplementation((element) =>
    original(element),
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  if (originalExecCommand)
    Object.defineProperty(document, "execCommand", originalExecCommand);
  else Reflect.deleteProperty(document, "execCommand");
});
describe("student directory", () => {
  it("keys paged searches independently", () => {
    expect(
      studentQueryKey({ q: "Ada", page: 2, limit: 25 }, "admin-a"),
    ).toEqual([
      "admin",
      "students",
      { q: "Ada", page: 2, limit: 25 },
      "admin-a",
    ]);
  });
  it("renders safe identity columns and searches with page reset", () => {
    render(
      <MemoryRouter>
        <Students />
      </MemoryRouter>,
    );
    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(screen.queryByText("Bakiye")).not.toBeInTheDocument();
    const search = screen.getByRole("searchbox", { name: "Öğrenci ara" });
    fireEvent.change(search, { target: { value: "Telegram" } });
    fireEvent.keyDown(search, { key: "Enter", code: "Enter" });
    expect(mocks.filters).toHaveBeenLastCalledWith({
      q: "Telegram",
      page: 1,
      limit: 25, joinedPeriod: "ALL", membership: "ALL", order: "NEWEST",
    });
  });
  it("finds a profile account number and opens that account for management", () => {
    render(
      <MemoryRouter initialEntries={["/students"]}>
        <Routes>
          <Route path="/students" element={<Students />} />
          <Route path="/students/:id" element={<AccountManagement />} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByTitle("2"));
    expect(mocks.filters).toHaveBeenLastCalledWith({
      q: "",
      page: 2,
      limit: 25, joinedPeriod: "ALL", membership: "ALL", order: "NEWEST",
    });
    const search = screen.getByPlaceholderText(
      "Hesap numarası, ad, e-posta veya Telegram",
    );
    fireEvent.change(search, { target: { value: accountId.toUpperCase() } });
    fireEvent.keyDown(search, { key: "Enter", code: "Enter" });
    expect(mocks.filters).toHaveBeenLastCalledWith({
      q: accountId.toUpperCase(),
      page: 1,
      limit: 25, joinedPeriod: "ALL", membership: "ALL", order: "NEWEST",
    });
    expect(
      screen.getByLabelText(`Hesap numarası: ${accountId}`),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hesabı yönet" }));
    expect(
      screen.getByRole("heading", { name: `Hesap yönetimi: ${accountId}` }),
    ).toBeInTheDocument();
  });
  it("copies the full account number from the compact identity row", () => {
    const copied: string[] = [];
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: vi.fn(() => {
        copied.push(window.getSelection()?.toString() ?? "");
        return true;
      }),
    });
    render(
      <MemoryRouter>
        <Students />
      </MemoryRouter>,
    );
    expect(
      screen.getByLabelText(`Hesap numarası: ${accountId}`),
    ).toHaveTextContent("f3245f75…");
    fireEvent.click(
      screen.getByRole("button", { name: "Hesap numarasını kopyala" }),
    );
    expect(copied).toEqual([accountId]);
  });
  it("shows explicit fetch failure and rollout state", () => {
    mocks.enabled = false;
    mocks.error = true;
    render(
      <MemoryRouter>
        <Students />
      </MemoryRouter>,
    );
    expect(
      screen.getByText("Öğrenci erişim yönetimi henüz etkin değil."),
    ).toBeInTheDocument();
    expect(screen.getByText("Öğrenciler yüklenemedi")).toBeInTheDocument();
  });
});

it("shows joined time and preserves search while filters reset pagination", () => {
 render(<MemoryRouter><Students /></MemoryRouter>);
 expect(screen.getByText("13.10.2026 09:20")).toBeInTheDocument();
 expect(screen.getByText("Özbekistan · Tashkent")).toBeInTheDocument();expect(screen.getByText("Instagram reklamı")).toBeInTheDocument();expect(screen.getByText("Kayıt: Google")).toBeInTheDocument();
 fireEvent.click(screen.getByTitle("2"));
 fireEvent.change(screen.getByLabelText("Katılım zamanı"), {target:{value:"WEEK"}});
 expect(mocks.filters).toHaveBeenLastCalledWith({q:"",page:1,limit:25,joinedPeriod:"WEEK",membership:"ALL",order:"NEWEST"});
 fireEvent.change(screen.getByLabelText("Üyelik durumu"), {target:{value:"ACTIVE"}});
 fireEvent.change(screen.getByLabelText("Katılım sıralaması"), {target:{value:"OLDEST"}});
 expect(mocks.filters).toHaveBeenLastCalledWith({q:"",page:1,limit:25,joinedPeriod:"WEEK",membership:"ACTIVE",order:"OLDEST"});
});
