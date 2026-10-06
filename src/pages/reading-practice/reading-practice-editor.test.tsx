import { App } from "antd";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import ReadingPracticeEditor from "./reading-practice-editor";

const mocks = vi.hoisted(() => ({
  record: undefined as Record<string, unknown> | undefined,
  create: vi.fn(),
  update: vi.fn(),
  generateGlossary: vi.fn(),
  upload: vi.fn(),
}));

vi.mock("@/config/queries/reading-practice", () => ({
  useGetOneReadingPractice: () => ({
    data: mocks.record ? { data: mocks.record } : undefined,
    isLoading: false,
  }),
  useCreateReadingPractice: () => ({ mutate: mocks.create, isPending: false }),
  useUpdateReadingPractice: () => ({ mutate: mocks.update, isPending: false }),
  useGenerateReadingPracticeGlossary: () => ({
    mutate: mocks.generateGlossary,
    isPending: false,
  }),
}));

vi.mock("@/config/queries/file/upload.queries", () => ({
  useFileUpload: () => ({ mutate: mocks.upload, isPending: false }),
}));

function renderEditor(initialEntry: string) {
  const router = createMemoryRouter(
    [
      { path: "/reading-practice/new", element: <ReadingPracticeEditor /> },
      { path: "/reading-practice/:id/edit", element: <ReadingPracticeEditor /> },
      {
        path: "/reading-practice/:id/section-edit",
        element: <p>Dedicated section editor</p>,
      },
    ],
    { initialEntries: [initialEntry] },
  );

  render(
    <App>
      <RouterProvider router={router} />
    </App>,
  );
  return router;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.record = undefined;
  vi.stubGlobal(
    "Request",
    class extends Request {
      constructor(input: RequestInfo | URL, init?: RequestInit) {
        super(input, { ...init, signal: undefined });
      }
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ReadingPracticeEditor route ownership", () => {
  it("creates only comprehensive drafts from the legacy editor", () => {
    renderEditor("/reading-practice/new");

    expect(screen.queryByLabelText("Pratik türü")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Okuma bölümü")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Kaydet$/ }));

    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.create.mock.calls[0][0]).toMatchObject({
      practiceType: "COMPREHENSIVE",
    });
    expect(mocks.create.mock.calls[0][0]).not.toHaveProperty("sectionNumber");
  });

  it("redirects SECTION records opened through a stale legacy edit link", async () => {
    mocks.record = { id: "section-1", practiceType: "SECTION" };
    const router = renderEditor("/reading-practice/section-1/edit");

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        "/reading-practice/section-1/section-edit",
      ),
    );
    expect(await screen.findByText("Dedicated section editor")).toBeInTheDocument();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
