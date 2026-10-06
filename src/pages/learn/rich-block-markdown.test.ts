import { describe, expect, it } from "vitest";
import {
  isSafeRichEditorUrl,
  markdownLikeToTiptapHtml,
  tiptapJsonToMarkdownLike,
} from "./rich-block-markdown";

describe("Rich Learn block markdown bridge", () => {
  it("renders existing markdown-like text into safe editor html", () => {
    const html = markdownLikeToTiptapHtml(
      [
        "# Başlık",
        "",
        "Bu **kalın**, *italik*, ++altı çizili++, ~~üstü çizili~~ ve ==vurgulu== metin.",
        "",
        "1. Senin {{blank:adın}} ne?",
        "2. Benim {{blank}} Ada.",
        "",
        "| Alan | Örnek |",
        "| --- | --- |",
        "| Link | [site](https://turkishmock.uz) |",
      ].join("\n"),
    );

    expect(html).toContain("<h1>Başlık</h1>");
    expect(html).toContain("<strong>kalın</strong>");
    expect(html).toContain("<em>italik</em>");
    expect(html).toContain("<u>altı çizili</u>");
    expect(html).toContain("<s>üstü çizili</s>");
    expect(html).toContain("<mark>vurgulu</mark>");
    expect(html).toContain("{{blank:adın}}");
    expect(html).toContain("<table>");
    expect(html).toContain('href="https://turkishmock.uz"');
  });

  it("does not render raw html or unsafe javascript links as active html", () => {
    const html = markdownLikeToTiptapHtml(
      '<script>window.bad = true</script> [kötü](javascript:alert(1))',
    );

    expect(html).not.toContain("<script>");
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("kötü");
  });

  it("serializes editor json to the student renderer markdown-like format", () => {
    const markdown = tiptapJsonToMarkdownLike({
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Alt başlık" }],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "kalın", marks: [{ type: "bold" }] },
            { type: "text", text: " " },
            { type: "text", text: "italik", marks: [{ type: "italic" }] },
            { type: "text", text: " " },
            { type: "text", text: "çizili", marks: [{ type: "underline" }] },
            { type: "text", text: " " },
            { type: "text", text: "vurgulu", marks: [{ type: "highlight" }] },
            { type: "text", text: " {{blank:adım}}" },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "güvenli",
              marks: [{ type: "link", attrs: { href: "https://turkishmock.uz" } }],
            },
            { type: "text", text: " " },
            {
              type: "text",
              text: "güvensiz",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
      ],
    });

    expect(markdown).toContain("## Alt başlık");
    expect(markdown).toContain("**kalın**");
    expect(markdown).toContain("*italik*");
    expect(markdown).toContain("++çizili++");
    expect(markdown).toContain("==vurgulu==");
    expect(markdown).toContain("{{blank:adım}}");
    expect(markdown).toContain("[güvenli](https://turkishmock.uz)");
    expect(markdown).toContain("güvensiz");
    expect(markdown).not.toContain("javascript:");
  });

  it("serializes simple tables without changing the backend content shape", () => {
    const markdown = tiptapJsonToMarkdownLike({
      type: "doc",
      content: [
        {
          type: "table",
          content: [
            {
              type: "tableRow",
              content: [
                {
                  type: "tableHeader",
                  content: [{ type: "paragraph", content: [{ type: "text", text: "Alan" }] }],
                },
                {
                  type: "tableHeader",
                  content: [{ type: "paragraph", content: [{ type: "text", text: "Örnek" }] }],
                },
              ],
            },
            {
              type: "tableRow",
              content: [
                {
                  type: "tableCell",
                  content: [{ type: "paragraph", content: [{ type: "text", text: "Yazma" }] }],
                },
                {
                  type: "tableCell",
                  content: [{ type: "paragraph", content: [{ type: "text", text: "Resmi e-posta" }] }],
                },
              ],
            },
          ],
        },
      ],
    });

    expect(markdown).toBe(
      ["| Alan | Örnek |", "| --- | --- |", "| Yazma | Resmi e-posta |"].join("\n"),
    );
  });

  it("accepts only safe editor links", () => {
    expect(isSafeRichEditorUrl("https://turkishmock.uz")).toBe(true);
    expect(isSafeRichEditorUrl("/app/dersler")).toBe(true);
    expect(isSafeRichEditorUrl("#bolum")).toBe(true);
    expect(isSafeRichEditorUrl("mailto:test@example.com")).toBe(true);
    expect(isSafeRichEditorUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeRichEditorUrl("data:text/html,<script>bad()</script>")).toBe(false);
  });
});
