import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Editor from "./listening-practice-glossary-editor";
import type { PracticeContent } from "./listening-practice-feedback-model";
const mocks = vi.hoisted(() => ({ mutate: vi.fn() }));
vi.mock("@/config/queries/reading-practice/generate-glossary.queries", () => ({
  useGenerateReadingPracticeGlossary: () => ({
    mutate: mocks.mutate,
    isPending: false,
  }),
}));
beforeEach(() => {
  // jsdom lacks pseudo-element styles used by Ant Design's modal scrollbar check.
  const computedStyle = window.getComputedStyle.bind(window);
  vi.spyOn(window, "getComputedStyle").mockImplementation((element) =>
    computedStyle(element),
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});
it("edits dictionary meanings without altering the transcript, answer key or audio", () => {
  const initial: PracticeContent = {
    audioUrl: "/audio.mp3",
    parts: [
      {
        sections: [
          {
            id: "s1",
            transcript: "Kentin kalıntıları.",
            questions: [
              {
                id: "q1",
                number: 19,
                answers: [{ variantText: "D", correct: true }],
              },
            ],
          },
        ],
      },
    ],
  };
  let saved = initial;
  function Harness() {
    const [content, setContent] = useState(initial);
    return (
      <Editor
        content={content}
        onChange={(next) => {
          saved = next;
          setContent(next);
        }}
      />
    );
  }
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "Kelime ekle" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Metindeki kelime" }), {
    target: { value: "kalıntıları" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Temel biçim" }), {
    target: { value: "kalıntı" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Kelimenin anlamı" }), {
    target: { value: "Eski bir yapıdan kalan parçalar." },
  });
  expect(saved.parts[0].sections[0].glossaryEntries?.[0]).toMatchObject({
    term: "kalıntıları",
    baseForm: "kalıntı",
    baseMeaning: "Eski bir yapıdan kalan parçalar.",
  });
  expect(saved.audioUrl).toBe(initial.audioUrl);
  expect(saved.parts[0].sections[0].questions).toEqual(
    initial.parts[0].sections[0].questions,
  );
  expect(saved.parts[0].sections[0].transcript).toBe(
    initial.parts[0].sections[0].transcript,
  );
});

it("prepares every missing word with the reading glossary service after confirmation", () => {
  const initial: PracticeContent = {
    parts: [
      {
        sections: [
          {
            id: "s1",
            transcript: "Bu ve bu.",
            questions: [],
            glossaryEntries: [
              {
                term: "Bu",
                baseMeaning: "Yakındaki bir şeyi gösterir.",
                occurrenceIndex: 1,
              },
            ],
          },
        ],
      },
    ],
  };
  render(<Editor content={initial} onChange={() => {}} />);
  expect(screen.getByRole("status").textContent).toContain("1 / 3");
  fireEvent.click(
    screen.getByRole("button", { name: "Eksik kelimeleri hazırla" }),
  );
  expect(mocks.mutate).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Hazırla" }));
  expect(mocks.mutate).toHaveBeenCalledOnce();
  expect(mocks.mutate.mock.calls[0][0]).toMatchObject({
    paragraphs: [{ label: "s1", text: "Bu ve bu." }],
    existingEntries: [{ term: "Bu", occurrenceIndex: 1, paragraphLabel: "s1" }],
  });
});
