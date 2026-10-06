import { describe, expect, it } from "vitest";

import {
  formattedExplanationToHtml,
  tiptapExplanationToValue,
} from "./reading-evidence-explanation-format";

describe("reading evidence explanation editor formatting", () => {
  it("turns stored formatting tokens into visual editor HTML", () => {
    expect(
      formattedExplanationToHtml(
        "Bu **önemli**, *açıklayıcı* ve [green]doğru[/green].",
      ),
    ).toBe(
      "<p>Bu <strong>önemli</strong>, <em>açıklayıcı</em> ve <span data-evidence-color=\"green\">doğru</span>.</p>",
    );
  });

  it("escapes raw HTML while preserving supported formatting", () => {
    expect(
      formattedExplanationToHtml(
        "<script>kötü</script> [blue]güvenli[/blue]",
      ),
    ).toBe(
      "<p>&lt;script&gt;kötü&lt;/script&gt; <span data-evidence-color=\"blue\">güvenli</span></p>",
    );
  });

  it("stores visual editor marks in the existing result-compatible format", () => {
    expect(
      tiptapExplanationToValue({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "Bu " },
              {
                type: "text",
                text: "kanıt",
                marks: [{ type: "bold" }, { type: "evidenceGreen" }],
              },
              { type: "text", text: " doğrudur." },
            ],
          },
        ],
      }),
    ).toBe("Bu [green]**kanıt**[/green] doğrudur.");
  });
});
