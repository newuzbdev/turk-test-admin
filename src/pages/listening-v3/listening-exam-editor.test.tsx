import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createOfficialListeningDraft,
  type OfficialListeningDraft,
} from "./listening-editor-model";
import { ListeningExamEditorV3 } from "./listening-exam-editor";
import type { ListeningTranscriptAlignmentSummary } from "@/config/queries/test/publication.queries";

const { createFileAccessUrlMock, createFileDownloadUrlMock } = vi.hoisted(
  () => ({
    createFileAccessUrlMock: vi.fn(),
    createFileDownloadUrlMock: vi.fn(),
  }),
);

vi.mock("@/config/queries/file/upload.queries", () => ({
  createFileAccessUrl: createFileAccessUrlMock,
  createFileDownloadUrl: createFileDownloadUrlMock,
  useFileUpload: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
}));

const selectTranscriptText = (
  container: HTMLElement,
  selectedText: string,
) => {
  const sourceElements = Array.from(
    container.querySelectorAll<HTMLElement>(
      "[data-transcript-source-text]",
    ),
  );
  const source = sourceElements
    .map((element) => element.textContent ?? "")
    .join("");
  const selectionStart = source.indexOf(selectedText);
  const selectionEnd = selectionStart + selectedText.length;

  expect(selectionStart).toBeGreaterThanOrEqual(0);

  let cursor = 0;
  let startNode: Text | null = null;
  let startOffset = 0;
  let endNode: Text | null = null;
  let endOffset = 0;

  for (const element of sourceElements) {
    const node = element.firstChild;
    if (!(node instanceof Text)) continue;
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

describe("ListeningExamEditorV3", () => {
  beforeEach(() => {
    createFileAccessUrlMock.mockReset();
    createFileDownloadUrlMock.mockReset();
  });

  it("renews an expired protected audio preview without another upload", async () => {
    const draft = createOfficialListeningDraft({
      ieltsId: "10000000-0000-4000-8000-000000000001",
      title: "Dinleme testi",
    });
    const expiredUrl = "https://api.example.com/api/file/media/expired-token";
    const freshUrl = "https://api.example.com/api/file/media/fresh-token";
    draft.audioUrl = expiredUrl;
    draft.audioDurationSeconds = 120;
    createFileAccessUrlMock.mockResolvedValue(freshUrl);

    const { container } = render(
      <ListeningExamEditorV3
        initialDraft={draft}
        onSave={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const initialAudio = container.querySelector("audio");
    expect(initialAudio).not.toBeNull();
    expect(initialAudio).toHaveAttribute("src", expiredUrl);

    fireEvent.error(initialAudio as HTMLAudioElement);

    await waitFor(() =>
      expect(createFileAccessUrlMock).toHaveBeenCalledWith(expiredUrl),
    );
    await waitFor(() =>
      expect(container.querySelector("audio")).toHaveAttribute("src", freshUrl),
    );
    expect(
      screen.queryByText(/Dosyayı yeniden yüklemeyi deneyin/i),
    ).not.toBeInTheDocument();
  });

  it("disables a shared matching choice after another question uses it", () => {
    const draft = createOfficialListeningDraft({
      ieltsId: "10000000-0000-4000-8000-000000000001",
      title: "Dinleme testi",
    });

    render(
      <ListeningExamEditorV3
        initialDraft={draft}
        onSave={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Bölüm 3/ }));
    fireEvent.click(
      screen.getByRole("radio", { name: "A seçeneğini doğru cevap yap" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "S16" }));

    expect(
      screen.getByRole("radio", { name: "A seçeneğini doğru cevap yap" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("radio", { name: "B seçeneğini doğru cevap yap" }),
    ).toBeEnabled();
  });

  it("resolves a relative map image path against the API URL", () => {
    const draft = createOfficialListeningDraft({
      ieltsId: "10000000-0000-4000-8000-000000000001",
      title: "Dinleme testi",
    });
    draft.parts[3].imageUrl = "uploads/listening-map.jpg";

    render(
      <ListeningExamEditorV3
        initialDraft={draft}
        onSave={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Bölüm 4/ }));

    expect(
      screen.getByRole("img", { name: "Bölüm 4 harita ön izlemesi" }),
    ).toHaveAttribute(
      "src",
      `${import.meta.env.VITE_API_URL || "https://api.turkishmock.uz"}/uploads/listening-map.jpg`,
    );
  });

  it("renews an expired protected map preview without another upload", async () => {
    const draft = createOfficialListeningDraft({
      ieltsId: "10000000-0000-4000-8000-000000000001",
      title: "Dinleme testi",
    });
    const expiredUrl = "https://api.example.com/api/file/media/expired-map";
    const freshUrl = "https://api.example.com/api/file/media/fresh-map";
    draft.parts[3].imageUrl = expiredUrl;
    createFileAccessUrlMock.mockResolvedValue(freshUrl);

    render(
      <ListeningExamEditorV3
        initialDraft={draft}
        onSave={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Bölüm 4/ }));
    const initialImage = screen.getByRole("img", {
      name: "Bölüm 4 harita ön izlemesi",
    });
    fireEvent.error(initialImage);

    await waitFor(() =>
      expect(createFileAccessUrlMock).toHaveBeenCalledWith(expiredUrl),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("img", {
          name: "Bölüm 4 harita ön izlemesi",
        }),
      ).toHaveAttribute("src", freshUrl),
    );
  });

  it("shows live alignment progress and a sentence verification control", async () => {
    const draft = createOfficialListeningDraft({
      ieltsId: "10000000-0000-4000-8000-000000000001",
      title: "Dinleme testi",
    });
    draft.audioUrl = "private-media://authenticated/listening/test.mp3";
    draft.audioDurationSeconds = 240;
    draft.parts.forEach((part) => {
      part.transcript = `Bölüm ${part.number} kontrol cümlesi.`;
    });

    let finishAlignment:
      | ((value: ListeningTranscriptAlignmentSummary) => void)
      | undefined;
    const onAutoAlign = vi.fn(
      () =>
        new Promise<ListeningTranscriptAlignmentSummary>((resolve) => {
          finishAlignment = resolve;
        }),
    );

    render(
      <ListeningExamEditorV3
        initialDraft={draft}
        onSave={vi.fn()}
        onAutoAlign={onAutoAlign}
        onBack={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Otomatik eşleştir" }),
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Ses ve transcript analiz ediliyor",
    );
    expect(screen.getByRole("status")).toHaveTextContent("0:00");

    finishAlignment?.({
      testId: "test-id",
      model: "nova-3",
      totalSentences: 6,
      alignedSentences: 6,
      totalEvidence: 0,
      alignedEvidence: 0,
      sections: draft.parts.map((part, index) => ({
        sectionId: `section-${part.number}`,
        partNumber: part.number,
        totalSentences: 1,
        alignedSentences: 1,
        totalEvidence: 0,
        alignedEvidence: 0,
        confidence: 0.91,
        reviewSegment: {
          text: part.transcript,
          audioStartMs: index * 1000,
          audioEndMs: index * 1000 + 800,
          confidence: 0.91,
        },
      })),
    });

    await waitFor(() =>
      expect(screen.getByText(/6\/6 cümle/)).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", {
        name: "Bölüm 1 eşleştirmesini dinle",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Güven %91")).toHaveLength(6);
  });

  it("uses map letters without editable option text in part four", () => {
    const draft = createOfficialListeningDraft({
      ieltsId: "10000000-0000-4000-8000-000000000001",
      title: "Dinleme testi",
    });

    render(
      <ListeningExamEditorV3
        initialDraft={draft}
        onSave={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Bölüm 4/ }));

    expect(screen.getByText("Haritadaki doğru konum")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Seçenek metni")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("radio", { name: "A harfini doğru konum yap" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "S20" }));

    expect(
      screen.getByRole("radio", { name: "A harfini doğru konum yap" }),
    ).toBeDisabled();
  });

  it("replaces stale evidence without counting existing question labels", async () => {
    const draft = createOfficialListeningDraft({
      ieltsId: "10000000-0000-4000-8000-000000000001",
      title: "Dinleme testi",
    });
    const part = draft.parts[0];
    const firstEvidence = "Birinci kanıt cümlesi.";
    const secondEvidence = "İkinci kanıt cümlesi.";
    part.transcript = `${firstEvidence} ${secondEvidence}`;

    part.questions[0].evidence = {
      evidenceText: firstEvidence,
      textStart: 0,
      textEnd: firstEvidence.length,
      evidenceSpans: [
        {
          evidenceText: firstEvidence,
          textStart: 0,
          textEnd: firstEvidence.length,
        },
      ],
      explanation: "İlk sorunun açıklaması.",
      audioStartMs: 1000,
      audioEndMs: 2000,
    };
    part.questions[1].evidence = {
      evidenceText: "Eski transcript kanıtı.",
      textStart: 0,
      textEnd: 22,
      evidenceSpans: [
        {
          evidenceText: "Eski transcript kanıtı.",
          textStart: 0,
          textEnd: 22,
        },
      ],
      explanation: "İkinci sorunun açıklaması.",
      audioStartMs: 3000,
      audioEndMs: 4000,
    };

    const onSave = vi.fn();
    render(
      <ListeningExamEditorV3
        initialDraft={draft}
        onSave={onSave}
        onBack={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Kanıtları işaretle" }));
    fireEvent.click(screen.getByRole("button", { name: "S2" }));
    expect(
      screen.getByText("Transcript değişti. Bu kanıtı yeniden seçin."),
    ).toBeInTheDocument();

    const transcript = screen.getByLabelText(
      "Transcript üzerinden kanıt seç",
    );
    selectTranscriptText(transcript, secondEvidence);
    fireEvent.mouseUp(transcript);
    fireEvent.click(screen.getByRole("button", { name: "Vurgula" }));

    expect(
      screen.queryByText("Transcript değişti. Bu kanıtı yeniden seçin."),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));

    const savedDraft = onSave.mock.calls[0][0] as OfficialListeningDraft;
    const savedEvidence = savedDraft.parts[0].questions[1].evidence;
    const expectedStart = part.transcript.indexOf(secondEvidence);

    expect(savedEvidence?.evidenceSpans).toEqual([
      {
        evidenceText: secondEvidence,
        textStart: expectedStart,
        textEnd: expectedStart + secondEvidence.length,
      },
    ]);
    expect(savedEvidence?.explanation).toBe("İkinci sorunun açıklaması.");
    expect(savedDraft.parts[0].questions[0].evidence).toEqual(
      part.questions[0].evidence,
    );
  });

  it("keeps manual evidence timing collapsed until it is needed", () => {
    const draft = createOfficialListeningDraft({
      ieltsId: "10000000-0000-4000-8000-000000000001",
      title: "Dinleme testi",
    });
    const part = draft.parts[0];
    const evidenceText = "Birinci kanıt cümlesi.";
    part.transcript = evidenceText;
    part.questions[0].evidence = {
      evidenceText,
      textStart: 0,
      textEnd: evidenceText.length,
      evidenceSpans: [
        {
          evidenceText,
          textStart: 0,
          textEnd: evidenceText.length,
        },
      ],
      explanation: "Doğru cevabı destekleyen cümle.",
      audioStartMs: 1000,
      audioEndMs: 2000,
    };

    render(
      <ListeningExamEditorV3
        initialDraft={draft}
        onSave={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText("Hazır · 0:01–0:02")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Ses kanıtı başlangıç saniyesi"),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Zamanı elle düzelt" }),
    );

    expect(
      screen.getByLabelText("Ses kanıtı başlangıç saniyesi"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Ses kanıtı bitiş saniyesi"),
    ).toBeInTheDocument();
  });
});
