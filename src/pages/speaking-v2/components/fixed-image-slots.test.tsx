import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FixedImageSlots } from "./fixed-image-slots";

vi.mock("../speaking-v2-file.queries", () => ({
  createFileAccessUrl: vi.fn().mockResolvedValue(
    "http://127.0.0.1:3001/api/file/media/signed-image",
  ),
  useSpeakingV2FileUpload: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
}));

describe("FixedImageSlots", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders protected images through an image-destination access URL", async () => {
    render(
      <FixedImageSlots
        images={["pmr.v1.speaking-image"]}
        limit={1}
        disabled={false}
        onUploadStart={vi.fn()}
        onChange={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByAltText("Görsel 1")).toHaveAttribute(
        "src",
        "http://127.0.0.1:3001/api/file/media/signed-image",
      );
    });
  });
});
