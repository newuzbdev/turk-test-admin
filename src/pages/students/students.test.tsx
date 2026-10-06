import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { studentQueryKey } from "@/config/queries/students";
import Students from "./students";
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
            id: "student",
            name: "Ada",
            email: "ada@example.test",
            telegramUsername: "ada",
          },
        ],
        total: 1,
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
});
describe("student directory", () => {
  it("keys paged searches independently", () => {
    expect(studentQueryKey({ q: "Ada", page: 2, limit: 25 })).toEqual([
      "admin",
      "students",
      { q: "Ada", page: 2, limit: 25 },
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
      limit: 25,
    });
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
