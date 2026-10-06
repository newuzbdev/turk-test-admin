import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PromptAudioStatus } from "./prompt-audio-status";

describe("PromptAudioStatus", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("describes the Section 3 action as generating the question audio", () => {
    render(
      <PromptAudioStatus
        item={{
          key: "TASK_3_PROMPT",
          taskCode: "TASK_3",
          status: "MISSING",
          audioObjectKey: null,
          previewUrl: null,
          generatedAt: null,
          error: null,
        }}
        disabled={false}
        pending={false}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("region", { name: "Bölüm 3 · Tartışma sorusu" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sesi hazırla" }),
    ).toBeInTheDocument();
  });

  it("loads protected audio into a browser-local preview URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      // A real fetch response owns its Blob; jsdom and Node use different realms.
      new Response("audio", {
        status: 200,
        headers: { "Content-Type": "audio/wav" },
      }),
    );
    const createObjectURL = vi.fn().mockReturnValue("blob:admin-audio-preview");

    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL,
      revokeObjectURL: vi.fn(),
    });

    render(
      <PromptAudioStatus
        item={{
          key: "TASK_1_1_Q1",
          taskCode: "TASK_1_1",
          status: "READY",
          audioObjectKey: "speaking/question.wav",
          previewUrl: "http://127.0.0.1:3001/api/file/media/signed-audio",
          generatedAt: "2026-08-18T00:00:00.000Z",
          error: null,
        }}
        disabled={false}
        pending={false}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const audio = screen.getByLabelText("Bölüm 1.1 · Soru 1 ses önizlemesi");

    await waitFor(() => {
      expect(audio).toHaveAttribute("src", "blob:admin-audio-preview");
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:3001/api/file/media/signed-audio",
      expect.objectContaining({ credentials: "omit" }),
    );
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const previewBlob = createObjectURL.mock.calls[0][0] as Blob;
    expect(previewBlob.type).toBe("audio/wav");
    expect(previewBlob.size).toBe(5);
    // Node fetch and jsdom expose different Blob implementations.
    const text =
      typeof previewBlob.text === "function"
        ? await previewBlob.text()
        : await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsText(previewBlob);
          });
    expect(text).toBe("audio");
  });

  it("allows a ready audio to be regenerated or deleted", () => {
    const onRetry = vi.fn();
    const onDelete = vi.fn();

    render(
      <PromptAudioStatus
        item={{
          key: "TASK_2_PROMPT",
          taskCode: "TASK_2",
          status: "READY",
          audioObjectKey: "speaking/task-2.wav",
          previewUrl: null,
          generatedAt: "2026-08-18T00:00:00.000Z",
          error: null,
        }}
        disabled={false}
        pending={false}
        onRetry={onRetry}
        onDelete={onDelete}
      />,
    );

    screen.getByRole("button", { name: "Sesi yeniden hazırla" }).click();
    screen.getByRole("button", { name: "Bölüm 2 sesini sil" }).click();

    expect(onRetry).toHaveBeenCalledWith("TASK_2_PROMPT");
    expect(onDelete).toHaveBeenCalledWith("TASK_2_PROMPT");
  });
});
