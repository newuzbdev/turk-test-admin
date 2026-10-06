import { EMPTY_RICH_TEXT_DOCUMENT, type RichTextDocument } from "./types";

type RichTextNode = {
  type?: string;
  text?: string;
  marks?: Array<{ type: string }>;
  content?: RichTextNode[];
};

export type Task2PromptCopy = {
  intro: string;
  topic: string;
  instruction: string;
  format: string;
};

const TASK_2_INTRO = "Bir tartışma platformunda şu soruya cevap veriyorsunuz:";
const TASK_2_INSTRUCTION =
  "Fikirlerinizi gerekçeler ve örneklerle destekleyerek yazınız.";

const nodeText = (node?: RichTextNode | null): string => {
  if (!node) return "";
  if (node.type === "text") return node.text || "";
  return (node.content || []).map(nodeText).join("");
};

const paragraphTexts = (
  document?: RichTextDocument | null,
  includeEmpty = false,
): string[] => {
  const root = document as RichTextNode | null | undefined;
  const paragraphs = (root?.content || [])
    .filter((node) => node.type === "paragraph" || node.type === "blockquote")
    .map((node) => nodeText(node).trim());
  return includeEmpty ? paragraphs : paragraphs.filter(Boolean);
};

const stripOuterQuotes = (value: string): string =>
  value
    .trim()
    .replace(/^[“"]\s*/, "")
    .replace(/\s*[”"]$/, "")
    .trim();

const stripFormatLabel = (value: string): string =>
  value.replace(/^Şekli\s*:\s*/iu, "").trim();

const normalizeInlineText = (value: string): string =>
  value.trim().replace(/\s+/gu, " ");

const splitEmbeddedFormat = (
  instruction: string,
): { instruction: string; format: string } | null => {
  const match = instruction.match(/^([\s\S]*?)\s+Şekli\s*:\s*([\s\S]+)$/iu);
  if (!match) return null;

  const instructionText = normalizeInlineText(match[1] || "");
  const formatText = normalizeInlineText(match[2] || "");
  if (!instructionText || !formatText) return null;

  return {
    instruction: instructionText,
    format: formatText,
  };
};

export const getTask2DefaultCopy = (
  wordMin: number,
  wordMax: number,
): Task2PromptCopy => ({
  intro: TASK_2_INTRO,
  topic: "",
  instruction: TASK_2_INSTRUCTION,
  format:
    wordMin === wordMax
      ? `${wordMin} sözcükten oluşan bir kompozisyon yazınız.`
      : `${wordMin}-${wordMax} sözcükten oluşan bir kompozisyon yazınız.`,
});

export const extractTask2PromptCopy = (
  document: RichTextDocument | null | undefined,
  wordMin: number,
  wordMax: number,
): Task2PromptCopy => {
  const defaults = getTask2DefaultCopy(wordMin, wordMax);
  const paragraphs = paragraphTexts(document, true);
  const formatIndex = paragraphs.findIndex((value) =>
    /^Şekli\s*:/iu.test(value),
  );
  const quotedIndex = paragraphs.findIndex(
    (value) =>
      (/^“[\s\S]+”$/u.test(value) || /^"[\s\S]+"$/u.test(value)) &&
      stripOuterQuotes(value).length > 0,
  );
  const hasStructuredLayout =
    paragraphs.length >= 4 && (formatIndex === 3 || quotedIndex === 1);

  if (hasStructuredLayout) {
    const instruction = paragraphs[2] || defaults.instruction;
    const embeddedFormat = splitEmbeddedFormat(instruction);
    return {
      intro: paragraphs[0] || defaults.intro,
      topic: stripOuterQuotes(paragraphs[1] || ""),
      instruction: embeddedFormat?.instruction || instruction,
      format:
        embeddedFormat?.format ||
        stripFormatLabel(
          paragraphs[formatIndex >= 0 ? formatIndex : 3] || "",
        ) ||
        defaults.format,
    };
  }

  const nonEmptyParagraphs = paragraphs.filter(Boolean);
  const quotedParagraph = nonEmptyParagraphs.find(
    (value) =>
      (/^“[\s\S]+”$/u.test(value) || /^"[\s\S]+"$/u.test(value)) &&
      stripOuterQuotes(value).length > 0,
  );
  const combinedText = nonEmptyParagraphs.join("\n");
  const embeddedQuote = combinedText.match(/[“"]([^”"]+)[”"]/u);
  const legacyQuestion = nonEmptyParagraphs.find(
    (value) =>
      value.endsWith("?") &&
      !value.toLocaleLowerCase("tr").startsWith("bir tartışma platformunda"),
  );

  return {
    ...defaults,
    topic: stripOuterQuotes(
      quotedParagraph || embeddedQuote?.[1] || legacyQuestion || "",
    ),
    format:
      formatIndex >= 0
        ? stripFormatLabel(paragraphs[formatIndex]) || defaults.format
        : defaults.format,
  };
};

export const extractTask2Topic = (document?: RichTextDocument | null): string =>
  extractTask2PromptCopy(document, 180, 200).topic;

const paragraph = (
  text: string,
  marks?: Array<{ type: string }>,
): RichTextNode => ({
  type: "paragraph",
  content: text
    ? [
        {
          type: "text",
          text,
          ...(marks ? { marks } : {}),
        },
      ]
    : [],
});

export function createTask2PromptDocument(
  copy: Task2PromptCopy,
): RichTextDocument;
export function createTask2PromptDocument(
  topic: string,
  wordMin: number,
  wordMax: number,
): RichTextDocument;
export function createTask2PromptDocument(
  copyOrTopic: Task2PromptCopy | string,
  wordMin?: number,
  wordMax?: number,
): RichTextDocument {
  const legacyCall = typeof copyOrTopic === "string";
  const copy = legacyCall
    ? {
        ...getTask2DefaultCopy(wordMin || 180, wordMax || 200),
        topic: copyOrTopic,
      }
    : copyOrTopic;
  const normalizedTopic = normalizeInlineText(stripOuterQuotes(copy.topic));

  if (legacyCall && !normalizedTopic) {
    return JSON.parse(
      JSON.stringify(EMPTY_RICH_TEXT_DOCUMENT),
    ) as RichTextDocument;
  }

  return {
    type: "doc",
    content: [
      paragraph(normalizeInlineText(copy.intro)),
      {
        type: "blockquote",
        content: [paragraph(`“${normalizedTopic}”`)],
      },
      paragraph(normalizeInlineText(copy.instruction)),
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Şekli:",
            marks: [{ type: "bold" }],
          },
          {
            type: "text",
            text: ` ${normalizeInlineText(stripFormatLabel(copy.format))}`,
          },
        ],
      },
    ],
  };
}

export const getTask2FixedCopy = (wordMin: number, wordMax: number) => ({
  intro: getTask2DefaultCopy(wordMin, wordMax).intro,
  instruction: getTask2DefaultCopy(wordMin, wordMax).instruction,
  format: getTask2DefaultCopy(wordMin, wordMax).format,
});
