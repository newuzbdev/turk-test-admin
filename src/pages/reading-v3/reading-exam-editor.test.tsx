import officialReadingInstructions from "@/data/official-reading-instructions.json";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  createOfficialReadingDraft,
  type OfficialReadingDraft,
} from "./reading-editor-model";
import { ReadingExamEditorV3 } from "./reading-exam-editor";
import { completeReadingDraft, deferred } from "./test/reading-draft-fixture";

const selectText = (container: HTMLElement, selectedText: string) => {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let cursor = 0;
  let startNode: Text | null = null;
  let startOffset = 0;
  let endNode: Text | null = null;
  let endOffset = 0;
  const fullText = container.textContent ?? "";
  const selectionStart = fullText.indexOf(selectedText);
  const selectionEnd = selectionStart + selectedText.length;

  expect(selectionStart).toBeGreaterThanOrEqual(0);

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const nextCursor = cursor + node.data.length;
    if (!startNode && selectionStart >= cursor && selectionStart <= nextCursor) {
      startNode = node;
      startOffset = selectionStart - cursor;
    }
    if (selectionEnd >= cursor && selectionEnd <= nextCursor) {
      endNode = node;
      endOffset = selectionEnd - cursor;
      break;
    }
    cursor = nextCursor;
  }

  expect(startNode).not.toBeNull();
  expect(endNode).not.toBeNull();

  const range = document.createRange();
  range.setStart(startNode as Text, startOffset);
  range.setEnd(endNode as Text, endOffset);
  window.getSelection()?.removeAllRanges();
  window.getSelection()?.addRange(range);
};

describe("ReadingExamEditorV3", () => {
  it("locks editing and duplicate operations until save finishes, then uses the saved revision", async () => {
    const initialDraft = completeReadingDraft();
    const saving = deferred<OfficialReadingDraft>();
    const onSave = vi.fn().mockReturnValueOnce(saving.promise);
    render(<ReadingExamEditorV3 initialDraft={initialDraft} onSave={onSave} onBack={vi.fn()} />);
    const title = screen.getByLabelText("Test adı");
    fireEvent.change(title, { target: { value: "Kaydedilen başlık" } });
    fireEvent.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    expect(title).toBeDisabled();
    expect(document.querySelector("main")).toHaveAttribute("inert");
    fireEvent.change(title, { target: { value: "Geç değişiklik" } });
    fireEvent.click(screen.getByRole("button", { name: "İşlem sürüyor" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(title).toHaveValue("Kaydedilen başlık");
    await act(async () => saving.resolve({ ...initialDraft, title: "Kaydedilen başlık", contentRevision: 2 }));
    expect(title).toBeEnabled();
    expect(screen.getByText("Değişiklikler kaydedildi")).toBeInTheDocument();
    fireEvent.change(title, { target: { value: "Sonraki değişiklik" } });
    fireEvent.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
    expect(onSave.mock.calls[1][0]).toMatchObject({ contentRevision: 2, title: "Sonraki değişiklik" });
  });

  it("keeps local edits when the same test is refetched", () => {
    const initialDraft = completeReadingDraft();
    const props = { initialDraft, onSave: vi.fn(), onBack: vi.fn() };
    const view = render(<ReadingExamEditorV3 {...props} />);
    fireEvent.change(screen.getByLabelText("Test adı"), { target: { value: "Yerel değişiklik" } });
    view.rerender(<ReadingExamEditorV3 {...props} initialDraft={{ ...initialDraft, title: "Sunucu başlığı", contentRevision: 2 }} />);
    expect(screen.getByLabelText("Test adı")).toHaveValue("Yerel değişiklik");
    expect(screen.getByText("Kaydedilmemiş değişiklikler var")).toBeInTheDocument();
  });

  it("preserves dirty edits after a failed save and protects page unload", async () => {
    const saving = deferred<OfficialReadingDraft>();
    render(<ReadingExamEditorV3 initialDraft={completeReadingDraft()} onSave={() => saving.promise} onBack={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Test adı"), { target: { value: "Korunacak değişiklik" } });
    fireEvent.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    await act(async () => saving.reject(new Error("offline")));
    expect(screen.getByLabelText("Test adı")).toBeEnabled();
    expect(screen.getByLabelText("Test adı")).toHaveValue("Korunacak değişiklik");
    const unload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);
  });

  it("keeps the saved revision after publish fails and locks the complete save/publish sequence", async () => {
    const initialDraft = completeReadingDraft();
    const publishing = deferred<void>();
    const onSave = vi.fn().mockResolvedValue({ ...initialDraft, contentRevision: 2 });
    const onPublish = vi.fn().mockReturnValueOnce(publishing.promise);
    render(<ReadingExamEditorV3 initialDraft={initialDraft} onSave={onSave} onPublish={onPublish} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Yayın kontrolü" }));
    fireEvent.click(screen.getByRole("button", { name: "Yayınla" }));
    await waitFor(() => expect(onPublish).toHaveBeenCalledTimes(1));
    expect(onPublish.mock.calls[0][0].contentRevision).toBe(2);
    expect(screen.getByLabelText("Test adı")).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Yayınla" }));
    expect(onPublish).toHaveBeenCalledTimes(1);
    await act(async () => publishing.reject(new Error("not ready")));
    expect(screen.getByLabelText("Test adı")).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Yayınla" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
    expect(onSave.mock.calls[1][0].contentRevision).toBe(2);
  });

  it("requires an explicit revision for published content and becomes editable as a saved new draft", async () => {
    const initialDraft = { ...completeReadingDraft(), status: "PUBLISHED" as const };
    const onSave = vi.fn();
    const onRevise = vi.fn().mockImplementation(async (draft: OfficialReadingDraft) => ({ ...draft, testId: "test-2", status: "DRAFT", publishedAt: null }));
    render(<ReadingExamEditorV3 initialDraft={initialDraft} onSave={onSave} onRevise={onRevise} onBack={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Test adı"), { target: { value: "Yeni sürüm başlığı" } });
    expect(screen.getByRole("button", { name: "Taslağı kaydet" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Yeni sürüm oluştur" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Yeni sürüm oluştur" })).not.toBeInTheDocument());
    expect(onSave).not.toHaveBeenCalled();
    expect(onRevise.mock.calls[0][0].title).toBe("Yeni sürüm başlığı");
    expect(screen.getByRole("button", { name: "Taslağı kaydet" })).toBeEnabled();
  });

  it("opens as a fixed five-part Turkish authoring workspace", () => {
    render(
      <ReadingExamEditorV3
        initialDraft={createOfficialReadingDraft({
          ieltsId: "10000000-0000-4000-8000-000000000001",
          title: "Yeni okuma testi",
        })}
        onSave={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Okuma testi" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Bölüm 1/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Bölüm 5/ })).toBeInTheDocument();
    expect(screen.getByText("Sorular 1-6")).toBeInTheDocument();
    expect(screen.queryByText(/demo/i)).not.toBeInTheDocument();
  });

  it("shows the part-specific text-card editor for part 2", () => {
    render(
      <ReadingExamEditorV3
        initialDraft={createOfficialReadingDraft({
          ieltsId: "10000000-0000-4000-8000-000000000001",
          title: "Yeni okuma testi",
        })}
        onSave={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Bölüm 2/ }));

    expect(screen.getByText("Durum seçenekleri (A-J)")).toBeInTheDocument();
    expect(screen.getByText("Bilgi kartları (7-14)")).toBeInTheDocument();
    expect(screen.getByLabelText("S7 kart başlığı")).toBeInTheDocument();
    expect(screen.getByLabelText("S7 kart metni")).toBeInTheDocument();
    expect(screen.getByLabelText("A seçeneği").tagName).toBe("TEXTAREA");
    expect(screen.queryByText("Görsel URL'si")).not.toBeInTheDocument();
  });

  it("selects the correct answer inside the option row and keeps the official instruction read-only", async () => {
    const onSave = vi.fn();
    render(
      <ReadingExamEditorV3
        initialDraft={createOfficialReadingDraft({
          ieltsId: "10000000-0000-4000-8000-000000000001",
          title: "Yeni okuma testi",
        })}
        onSave={onSave}
        onBack={vi.fn()}
      />,
    );

    const instruction = screen.getByLabelText("Bölüm yönergesi");
    expect(instruction.tagName).toBe("P");
    expect(instruction).toHaveTextContent(officialReadingInstructions.parts["1"]);
    expect(screen.queryByRole("textbox", { name: "Bölüm yönergesi" })).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("radio", {
        name: "A seçeneğini doğru cevap yap",
      }),
    );
    expect(
      screen.queryByRole("group", { name: "Doğru cevap" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));

    const savedDraft = onSave.mock.calls[0][0];
    expect(savedDraft.parts[0].description).toBe(
      officialReadingInstructions.parts["1"],
    );
    expect(savedDraft.parts[0].questions[0].correctVariant).toBe("A");
  });

  it("shows section one options in a single column", () => {
    render(
      <ReadingExamEditorV3
        initialDraft={createOfficialReadingDraft({
          ieltsId: "10000000-0000-4000-8000-000000000001",
          title: "Yeni okuma testi",
        })}
        onSave={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const firstOption = screen.getByRole("radio", {
      name: "A seçeneğini doğru cevap yap",
    });
    const optionGrid = firstOption.closest("div")?.parentElement;

    expect(optionGrid).toHaveClass("grid-cols-1");
    expect(optionGrid).not.toHaveClass("sm:grid-cols-2");
  });

  it("saves a section one explanation without selecting a source quote", async () => {
    const onSave = vi.fn();
    render(
      <ReadingExamEditorV3
        initialDraft={createOfficialReadingDraft({
          ieltsId: "10000000-0000-4000-8000-000000000001",
          title: "Kanıtsız açıklama",
        })}
        onSave={onSave}
        onBack={vi.fn()}
      />,
    );

    const explanation = screen.getByRole("textbox", { name: "Neden doğru?" });
    const text = "Güçlük çekmek, bir işi yapmakta zorlanmak anlamına gelir.";
    await act(async () => {
      explanation.innerHTML = `<p>${text}</p>`;
      fireEvent.input(explanation);
    });
    fireEvent.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));

    expect(onSave.mock.calls[0][0].parts[0].questions[0].evidence).toEqual({
      evidenceText: "",
      textStart: 0,
      textEnd: 0,
      evidenceSpans: [],
      explanation: text,
    });
  });

  it("marks evidence in the section one source and keeps labels for other questions", () => {
    const draft = createOfficialReadingDraft({
      ieltsId: "10000000-0000-4000-8000-000000000001",
      title: "Yeni okuma testi",
    });
    draft.parts[0].sourceText =
      "Birinci kanıt cümlesi. İkinci kanıt cümlesi.";

    render(
      <ReadingExamEditorV3
        initialDraft={draft}
        onSave={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Kanıtları işaretle" }),
    );
    const source = screen.getByLabelText("Bölüm 1 kanıt metni");

    selectText(source, "Birinci kanıt cümlesi.");
    fireEvent.mouseUp(source);
    fireEvent.click(screen.getByRole("button", { name: "Vurgula" }));

    fireEvent.click(screen.getByRole("button", { name: /^S2$/ }));
    selectText(source, "İkinci kanıt cümlesi.");
    fireEvent.mouseUp(source);
    fireEvent.click(screen.getByRole("button", { name: "Vurgula" }));

    expect(
      screen.getByRole("button", { name: /S1 kanıtını aç/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /S2 kanıtını aç/ }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Neden doğru?")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Kalın yap" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Yeşil yap" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mavi yap" }),
    ).toBeInTheDocument();
  });

  it("keeps multiple evidence fragments for the same section one question", () => {
    const draft = createOfficialReadingDraft({
      ieltsId: "10000000-0000-4000-8000-000000000001",
      title: "Yeni okuma testi",
    });
    draft.parts[0].sourceText =
      "İlk destek kelimesi burada. İkinci destek cümlesi burada.";

    render(
      <ReadingExamEditorV3
        initialDraft={draft}
        onSave={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Kanıtları işaretle" }),
    );
    const source = screen.getByLabelText("Bölüm 1 kanıt metni");

    selectText(source, "destek kelimesi");
    fireEvent.mouseUp(source);
    fireEvent.click(screen.getByRole("button", { name: "Vurgula" }));

    selectText(source, "İkinci destek cümlesi burada.");
    fireEvent.mouseUp(source);
    fireEvent.click(screen.getByRole("button", { name: "Vurgula" }));

    expect(
      screen.getAllByRole("button", { name: /S1 kanıtını aç/ }),
    ).toHaveLength(2);
    expect(screen.getByText("2 kanıt")).toBeInTheDocument();
  });

  it.each([
    { partNumber: 3, questionNumber: 15 },
    { partNumber: 4, questionNumber: 21 },
    { partNumber: 5, questionNumber: 30 },
  ])(
    "marks evidence directly in the section $partNumber source",
    async ({ partNumber, questionNumber }) => {
      const draft = createOfficialReadingDraft({
        ieltsId: "10000000-0000-4000-8000-000000000001",
        title: "Yeni okuma testi",
      });
      const onSave = vi.fn();
      const part = draft.parts.find(
        (candidate) => candidate.number === partNumber,
      );
      if (!part) throw new Error(`Bölüm ${partNumber} bulunamadı.`);

      const evidenceText = `S${questionNumber} için kanıt cümlesi`;
      if (partNumber === 3) {
        part.questions[0].sourceText = `${evidenceText} ve paragrafın devamı.`;
      } else {
        part.sourceText = `${evidenceText} ve ortak metnin devamı.`;
      }

      render(
        <ReadingExamEditorV3
          initialDraft={draft}
          onSave={onSave}
          onBack={vi.fn()}
        />,
      );

      fireEvent.click(
        screen.getByRole("button", {
          name: new RegExp(`Bölüm ${partNumber}`),
        }),
      );
      const modeToggle = screen.getByRole("group", {
        name: `Bölüm ${partNumber} metin modu`,
      });
      fireEvent.click(
        within(modeToggle).getByRole("button", {
          name: "Kanıtları işaretle",
        }),
      );

      const source = screen.getByLabelText(
        `Bölüm ${partNumber} kanıt metni`,
      );
      selectText(source, evidenceText);
      fireEvent.mouseUp(source);
      fireEvent.click(screen.getByRole("button", { name: "Vurgula" }));

      expect(screen.getByText("1 kanıt")).toBeInTheDocument();
      expect(screen.getByLabelText("Neden doğru?")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
      await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
      const savedDraft = onSave.mock.calls[0][0] as OfficialReadingDraft;
      const savedQuestion = savedDraft.parts
        .find((candidate) => candidate.number === partNumber)
        ?.questions.find(
          (candidate) => candidate.number === questionNumber,
        );
      expect(savedQuestion?.evidence?.evidenceSpans).toEqual([
        expect.objectContaining({ evidenceText }),
      ]);
    },
  );

  it("keeps publication blocked and links the first issue to its question", () => {
    render(
      <ReadingExamEditorV3
        initialDraft={createOfficialReadingDraft({
          ieltsId: "10000000-0000-4000-8000-000000000001",
          title: "Yeni okuma testi",
        })}
        onSave={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Yayın kontrolü" }));

    expect(screen.getByText("Yayına hazır değil")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /S1/ }).length).toBeGreaterThan(0);
  });

  it("lets the author select evidence directly from the source text", () => {
    render(
      <ReadingExamEditorV3
        initialDraft={createOfficialReadingDraft({
          ieltsId: "10000000-0000-4000-8000-000000000001",
          title: "Yeni okuma testi",
        })}
        onSave={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Bölüm 2/ }));
    fireEvent.change(screen.getByLabelText("S7 kart başlığı"), {
      target: { value: "Kütüphane" },
    });
    fireEvent.change(screen.getByLabelText("S7 kart metni"), {
      target: {
        value: "Sessiz çalışma salonları öğrenciler için uygundur.",
      },
    });

    const source = screen.getByText((_, element) => {
      return (
        element?.tagName === "DIV" &&
        element.className.includes("select-text") &&
        element.textContent?.includes("Sessiz çalışma salonları") === true
      );
    });
    const selectedText = "Sessiz çalışma salonları";
    const textNode = Array.from(source.querySelectorAll("span"))
      .find((element) => element.textContent?.includes(selectedText))
      ?.firstChild;
    expect(textNode).not.toBeNull();

    const start = textNode?.textContent?.indexOf(selectedText) ?? -1;
    const range = document.createRange();
    range.setStart(textNode as Text, start);
    range.setEnd(textNode as Text, start + selectedText.length);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    fireEvent.mouseUp(source);
    fireEvent.click(screen.getByRole("button", { name: "Vurgula" }));
    expect(screen.getByLabelText("Neden doğru?")).toBeInTheDocument();
  });
});
