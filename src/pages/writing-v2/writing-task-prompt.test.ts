import { describe, expect, it } from "vitest";

import type { RichTextDocument } from "./types";
import {
  createTask2PromptDocument,
  extractTask2PromptCopy,
  extractTask2Topic,
  getTask2DefaultCopy,
  getTask2FixedCopy,
} from "./writing-task-prompt";

type TestNode = {
  type?: string;
  text?: string;
  marks?: Array<{ type: string }>;
  content?: TestNode[];
};

const asNode = (document: RichTextDocument) => document as TestNode;
const nodeText = (node: TestNode): string =>
  node.type === "text"
    ? node.text || ""
    : (node.content || []).map(nodeText).join("");

describe("Writing V2 Bölüm 2 prompt helpers", () => {
  it("creates the fixed four-paragraph student prompt around one topic", () => {
    const document = createTask2PromptDocument(
      " “Teknoloji eğitimde ne kadar kullanılmalı?” ",
      180,
      200,
    );
    const paragraphs = asNode(document).content || [];

    expect(paragraphs).toHaveLength(4);
    expect(paragraphs.map(nodeText)).toEqual([
      "Bir tartışma platformunda şu soruya cevap veriyorsunuz:",
      "“Teknoloji eğitimde ne kadar kullanılmalı?”",
      "Fikirlerinizi gerekçeler ve örneklerle destekleyerek yazınız.",
      "Şekli: 180-200 sözcükten oluşan bir kompozisyon yazınız.",
    ]);
    expect(paragraphs[1]?.type).toBe("blockquote");
    expect(paragraphs[1]?.content?.[0]?.type).toBe("paragraph");
    expect(paragraphs[3]?.content?.[0]?.marks).toEqual([{ type: "bold" }]);
  });

  it("keeps every editable Bölüm 2 text in the generated document", () => {
    const copy = {
      intro: "Bir eğitim forumunda aşağıdaki soruyu tartışıyorsunuz:",
      topic: "Teknoloji eğitimin yerini tamamen almalı mı?",
      instruction: "Görüşünüzü iki örnekle açıklayınız.",
      format: "200 sözcükten oluşan bir kompozisyon yazınız.",
    };
    const document = createTask2PromptDocument(copy);
    const paragraphs = asNode(document).content || [];

    expect(paragraphs.map(nodeText)).toEqual([
      copy.intro,
      `“${copy.topic}”`,
      copy.instruction,
      `Şekli: ${copy.format}`,
    ]);
    expect(extractTask2PromptCopy(document, 180, 200)).toEqual(copy);
  });

  it("separates a legacy embedded format sentence without losing text", () => {
    const document = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Bir tartışma platformunda şu soruya cevap veriyorsunuz:",
            },
          ],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "“Teknoloji eğitimde gerekli mi?”" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Fikirlerinizi örneklerle destekleyiniz. Şekli: 200 sözcük yardımıyla kompozisyon yazınız.",
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Şekli: 180-200 sözcükten oluşan bir kompozisyon yazınız.",
            },
          ],
        },
      ],
    } as RichTextDocument;

    expect(extractTask2PromptCopy(document, 180, 200)).toEqual({
      intro: "Bir tartışma platformunda şu soruya cevap veriyorsunuz:",
      topic: "Teknoloji eğitimde gerekli mi?",
      instruction: "Fikirlerinizi örneklerle destekleyiniz.",
      format: "200 sözcük yardımıyla kompozisyon yazınız.",
    });
  });

  it("extracts the topic from new and legacy prompt documents", () => {
    const generated = createTask2PromptDocument(
      "Geleneksel yöntemler tamamen bırakılmalı mı?",
      180,
      200,
    );
    const legacy = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: 'Konu: "Okullarda telefon kullanılmalı mı?"',
            },
          ],
        },
      ],
    };

    expect(extractTask2Topic(generated)).toBe(
      "Geleneksel yöntemler tamamen bırakılmalı mı?",
    );
    expect(extractTask2Topic(legacy)).toBe(
      "Okullarda telefon kullanılmalı mı?",
    );
  });

  it("keeps an empty topic invalid for publishing", () => {
    expect(createTask2PromptDocument("   ", 180, 200)).toEqual({
      type: "doc",
      content: [{ type: "paragraph" }],
    });
  });

  it("builds the fixed candidate-facing copy from the word target", () => {
    expect(getTask2FixedCopy(180, 200)).toEqual({
      intro: "Bir tartışma platformunda şu soruya cevap veriyorsunuz:",
      instruction:
        "Fikirlerinizi gerekçeler ve örneklerle destekleyerek yazınız.",
      format: "180-200 sözcükten oluşan bir kompozisyon yazınız.",
    });
    expect(getTask2DefaultCopy(180, 200)).toEqual({
      intro: "Bir tartışma platformunda şu soruya cevap veriyorsunuz:",
      topic: "",
      instruction:
        "Fikirlerinizi gerekçeler ve örneklerle destekleyerek yazınız.",
      format: "180-200 sözcükten oluşan bir kompozisyon yazınız.",
    });
  });
});
