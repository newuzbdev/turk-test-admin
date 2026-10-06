import { describe, expect, it } from "vitest";
import ReadingEditorPageV3 from "@/pages/reading-v3/reading-editor-page-v3";
import { routerConfig } from "./router-config";

describe("Okuma editörü rotaları", () => {
  it.each([
    "reading/:ieltsId/edit-v3",
    "reading/:ieltsId/edit-v2",
    "reading/:ieltsId/edit",
  ])("%s rotasında yeni editörü kullanır", (path) => {
    const route = routerConfig.find((item) => item.path === path);

    expect(route).toBeDefined();
    expect(route?.page).toMatchObject({ type: ReadingEditorPageV3 });
  });
});
