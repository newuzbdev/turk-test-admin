import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock("@/config/queries/reading/create.queries", () => ({
  useCreateReadingTestWithAddition: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("./reading-section-editor", () => ({
  default: (props: {
    section: { title: string };
    locale?: string;
  }) => (
    <div
      data-testid="reading-section-editor"
      data-locale={props.locale || ""}
    >
      {props.section.title}
    </div>
  ),
}));

import ReadingTestEditor from "./reading-test-editor";

const testData = {
  title: "CEFR Okuma Denemesi",
  description: "Beş bölümlü okuma sınavı",
  parts: [
    {
      id: "part-1",
      title: "Bölüm 1",
      description: "Boşluk doldurma",
      sections: [
        {
          id: "section-1",
          title: "Birinci bölüm metni",
          content: "Örnek metin",
          questions: [],
        },
      ],
    },
    {
      id: "part-2",
      title: "Bölüm 2",
      description: "Metin eşleştirme",
      sections: [
        {
          id: "section-2",
          title: "İkinci bölüm metni",
          content: "İkinci örnek metin",
          questions: [],
        },
      ],
    },
  ],
};

describe("ReadingTestEditor v2 layout", () => {
  it("shows Turkish part tabs and only renders the selected part", async () => {
    render(
      <MemoryRouter>
        <ReadingTestEditor
          layout="v2"
          ieltsId=""
          testId="test-123"
          backUrl="/reading"
          useGetTestWithAddition={() => ({ data: testData })}
          useUpdateTestWithAddition={() => ({
            mutate: vi.fn(),
            isPending: false,
          })}
        />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("tab", { name: "Genel Bilgiler" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Bölüm 1" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Bölüm 2" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Kontrol" })).toBeInTheDocument();
    expect(screen.queryByText("Reading Test Editor")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Bölüm 1" }));

    await waitFor(() => {
      expect(screen.getByText("Birinci bölüm metni")).toBeInTheDocument();
    });
    expect(screen.queryByText("İkinci bölüm metni")).not.toBeInTheDocument();
    expect(screen.getByTestId("reading-section-editor")).toHaveAttribute(
      "data-locale",
      "tr",
    );

    fireEvent.click(screen.getByRole("tab", { name: "Bölüm 2" }));

    await waitFor(() => {
      expect(screen.getByText("İkinci bölüm metni")).toBeInTheDocument();
    });
    expect(screen.queryByText("Birinci bölüm metni")).not.toBeInTheDocument();
  });
});
