import { useState } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import ListeningPracticeFeedbackEditor from "./listening-practice-feedback-editor";
import type { PracticeContent } from "./listening-practice-feedback-model";
const text = "Girişin sağındaki bina müzedir. Solda bilet gişesi vardır.";
const fixture: PracticeContent = {
  audioUrl: "/audio.mp3",
  audioDurationSeconds: 40,
  parts: [
    {
      sections: [
        {
          id: "s",
          transcript: text,
          questions: [
            {
              id: "q1",
              number: 19,
              text: "Müze",
              answers: [{ variantText: "D", correct: true }],
            },
          ],
        },
      ],
    },
  ],
};
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("authors an exact quote, captures playback times and keeps explanation on the selected question", async () => {
  let saved = structuredClone(fixture);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  function Harness() {
    const [content, setContent] = useState(saved);
    return (
      <ListeningPracticeFeedbackEditor
        content={content}
        onChange={(value) => {
          saved = value;
          setContent(value);
        }}
      />
    );
  }
  const view = render(<Harness />);
  const transcript = screen.getByRole("textbox", {
    name: "Cevap kanıtı seçilecek transkript",
  }) as HTMLTextAreaElement;
  act(() => {
    transcript.focus();
    transcript.setSelectionRange(0, text.indexOf(".") + 1);
    fireEvent.select(transcript);
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Seçili metni cevap kanıtı yap" }),
  );
  expect(saved.parts[0].sections[0].questions[0].evidence?.evidenceText).toBe(
    "Girişin sağındaki bina müzedir.",
  );
  const audio = view.container.querySelector("audio")!;
  audio.currentTime = 2.25;
  fireEvent.click(screen.getAllByRole("button", { name: "Şu anı al" })[0]);
  audio.currentTime = 5.75;
  fireEvent.click(screen.getAllByRole("button", { name: "Şu anı al" })[1]);
  fireEvent.change(
    screen.getByRole("textbox", { name: "Cevabın açıklaması" }),
    { target: { value: "Sağdaki yapı D harfidir." } },
  );
  expect(saved.parts[0].sections[0].questions[0].evidence).toMatchObject({
    audioStartMs: 2250,
    audioEndMs: 5750,
    explanation: "Sağdaki yapı D harfidir.",
  });
  expect(screen.getByText("1 / 1 soru hazır")).toBeInTheDocument();
  await act(async () => {
    fireEvent.click(
      screen.getByRole("button", { name: "Seçilen aralığı dinle" }),
    );
  });
  expect(audio.currentTime).toBe(2.25);
  audio.currentTime = 5.8;
  fireEvent.timeUpdate(audio);
  expect(audio.pause).toHaveBeenCalled();
  expect(fixture.parts[0].sections[0].questions[0].evidence).toBeUndefined();
});
