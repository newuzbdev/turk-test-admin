import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ListeningExamEditorV3 } from "./listening-exam-editor";
import type { OfficialListeningDraft } from "./listening-editor-model";
import { completeListeningDraft, deferred } from "./test/listening-draft-fixture";

vi.mock("@/config/queries/file/upload.queries", () => ({
  useFileUpload: () => ({ isPending: false, mutateAsync: vi.fn() }),
  createFileAccessUrl: vi.fn(), createFileDownloadUrl: vi.fn(),
}));
afterEach(cleanup);

describe("listening authoring operation boundaries", () => {
  it("allows a part-one explanation and audio range to be authored without selecting a transcript quote", async () => {
    const draft = completeListeningDraft();
    draft.parts[0].questions[0].evidence = undefined;
    const onSave = vi.fn().mockImplementation(async (value) => value);
    render(<ListeningExamEditorV3 initialDraft={draft} onSave={onSave} onBack={vi.fn()} />);
    expect(screen.queryByText("Önce transcript üzerinden kanıt seçin.")).not.toBeInTheDocument();
    const explanation = await screen.findByRole("textbox", { name: "Neden doğru?" });
    await act(async () => {
      explanation.innerHTML = "<p>Bu söze uygun karşılık B seçeneğidir.</p>";
      fireEvent.input(explanation);
    });
    fireEvent.click(screen.getByRole("button", { name: "Zamanı elle düzelt" }));
    fireEvent.change(screen.getByLabelText("Ses kanıtı başlangıç saniyesi"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Ses kanıtı bitiş saniyesi"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0].parts[0].questions[0].evidence).toMatchObject({
      evidenceText: "", evidenceSpans: [], explanation: "Bu söze uygun karşılık B seçeneğidir.", audioStartMs: 1000, audioEndMs: 3000,
    });
  });

  it("locks all inputs and prevents duplicate saves until canonical IDs and revision are received", async () => {
    const draft = completeListeningDraft();
    const pending = deferred<OfficialListeningDraft>();
    const onSave = vi.fn().mockReturnValueOnce(pending.promise).mockImplementation(async (value) => value);
    render(<ListeningExamEditorV3 initialDraft={draft} onSave={onSave} onBack={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Test adı"), { target: { value: "Yeni başlık" } });
    fireEvent.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    expect(screen.getByLabelText("Test adı")).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Duyulan metin" }).closest("main")).toHaveAttribute("inert");
    fireEvent.change(screen.getByLabelText("Test adı"), { target: { value: "Kayda girmemeli" } });
    fireEvent.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = { ...draft, title: "Yeni başlık", contentRevision: 2 };
    saved.parts[0].questions[0].apiId = "canonical-question";
    await act(async () => pending.resolve(saved));
    expect(screen.getByLabelText("Test adı")).toHaveValue("Yeni başlık");
    fireEvent.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
    expect(onSave.mock.calls[1][0].contentRevision).toBe(2);
    expect(onSave.mock.calls[1][0].parts[0].questions[0].apiId).toBe("canonical-question");
  });

  it("ignores same-test refetch while preserving unsaved edits and unload protection", () => {
    const draft = completeListeningDraft();
    const props = { initialDraft: draft, onSave: vi.fn(), onBack: vi.fn() };
    const view = render(<ListeningExamEditorV3 {...props} />);
    fireEvent.change(screen.getByLabelText("Test adı"), { target: { value: "Yerel taslak" } });
    view.rerender(<ListeningExamEditorV3 {...props} initialDraft={{ ...draft, title: "Refetch başlığı", contentRevision: 2 }} />);
    expect(screen.getByLabelText("Test adı")).toHaveValue("Yerel taslak");
    expect(screen.getByText("Kaydedilmemiş değişiklikler var")).toBeInTheDocument();
    const unload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);
  });

  it("keeps unsaved content editable after a failed save", async () => {
    const pending = deferred<void>();
    render(<ListeningExamEditorV3 initialDraft={completeListeningDraft()} onSave={() => pending.promise} onBack={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Test adı"), { target: { value: "Korunan başlık" } });
    fireEvent.click(screen.getByRole("button", { name: "Taslağı kaydet" }));
    await act(async () => pending.reject(new Error("offline")));
    expect(screen.getByLabelText("Test adı")).toBeEnabled();
    expect(screen.getByLabelText("Test adı")).toHaveValue("Korunan başlık");
    expect(screen.getByText("Kaydedilmemiş değişiklikler var")).toBeInTheDocument();
  });

  it("locks auto-alignment and adopts its canonical timing without refetch overwriting the saved draft", async () => {
    const draft = completeListeningDraft();
    const pending = deferred<{ testId: string; model: string; totalSentences: number; alignedSentences: number; totalEvidence: number; alignedEvidence: number; sections: []; savedDraft: OfficialListeningDraft }>();
    const onAlign = vi.fn().mockReturnValue(pending.promise);
    const onSave = vi.fn();
    const view = render(<ListeningExamEditorV3 initialDraft={draft} onSave={onSave} onBack={vi.fn()} onAutoAlign={onAlign} />);
    fireEvent.click(screen.getByRole("button", { name: "Otomatik eşleştir" }));
    expect(screen.getByLabelText("Test adı")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Taslağı kaydet" })).toBeDisabled();
    view.rerender(<ListeningExamEditorV3 initialDraft={{ ...draft, title: "Eski refetch" }} onSave={onSave} onBack={vi.fn()} onAutoAlign={onAlign} />);
    const saved = structuredClone(draft);
    saved.contentRevision = 3;
    saved.parts[0].questions[0].evidence!.audioStartMs = 5000;
    saved.parts[0].questions[0].evidence!.audioEndMs = 7000;
    await act(async () => pending.resolve({ testId: "test-1", model: "synthetic", totalSentences: 1, alignedSentences: 1, totalEvidence: 1, alignedEvidence: 1, sections: [], savedDraft: saved }));
    expect(screen.getByText("Hazır · 0:05–0:07")).toBeInTheDocument();
    expect(screen.getByLabelText("Test adı")).toHaveValue("Dinleme testi");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Taslağı kaydet" })));
    expect(onSave.mock.calls[0][0].contentRevision).toBe(3);
  });
});
