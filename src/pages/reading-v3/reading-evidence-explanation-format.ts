type TiptapMark = {
  type?: string;
};

type TiptapNode = {
  type?: string;
  text?: string;
  marks?: TiptapMark[];
  content?: TiptapNode[];
};

type InlineFormatRule = {
  open: string;
  close: string;
  renderHtml: (content: string) => string;
};

const formatRules: InlineFormatRule[] = [
  {
    open: "**",
    close: "**",
    renderHtml: (content) => `<strong>${content}</strong>`,
  },
  {
    open: "[green]",
    close: "[/green]",
    renderHtml: (content) =>
      `<span data-evidence-color="green">${content}</span>`,
  },
  {
    open: "[blue]",
    close: "[/blue]",
    renderHtml: (content) =>
      `<span data-evidence-color="blue">${content}</span>`,
  },
  {
    open: "*",
    close: "*",
    renderHtml: (content) => `<em>${content}</em>`,
  },
];

const nextFormatRule = (value: string, from: number) => {
  const matches = formatRules
    .map((rule) => ({ rule, index: value.indexOf(rule.open, from) }))
    .filter((match) => match.index >= 0)
    .sort(
      (left, right) =>
        left.index - right.index ||
        right.rule.open.length - left.rule.open.length,
    );

  return matches[0] || null;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>");

const renderFormattedInlineHtml = (value: string): string => {
  let html = "";
  let cursor = 0;

  while (cursor < value.length) {
    const match = nextFormatRule(value, cursor);
    if (!match) {
      html += escapeHtml(value.slice(cursor));
      break;
    }

    if (match.index > cursor) {
      html += escapeHtml(value.slice(cursor, match.index));
    }

    const contentStart = match.index + match.rule.open.length;
    const contentEnd = value.indexOf(match.rule.close, contentStart);
    if (contentEnd < 0) {
      html += escapeHtml(value.slice(match.index));
      break;
    }

    html += match.rule.renderHtml(
      renderFormattedInlineHtml(value.slice(contentStart, contentEnd)),
    );
    cursor = contentEnd + match.rule.close.length;
  }

  return html;
};

export const formattedExplanationToHtml = (value: string) =>
  `<p>${renderFormattedInlineHtml(value)}</p>`;

const applyMarks = (value: string, marks: TiptapMark[]) =>
  marks.reduce((currentValue, mark) => {
    if (mark.type === "bold") return `**${currentValue}**`;
    if (mark.type === "italic") return `*${currentValue}*`;
    if (mark.type === "evidenceGreen") {
      return `[green]${currentValue}[/green]`;
    }
    if (mark.type === "evidenceBlue") {
      return `[blue]${currentValue}[/blue]`;
    }
    return currentValue;
  }, value);

const serializeInlineNode = (node: TiptapNode): string => {
  if (node.type === "hardBreak") return "\n";
  if (node.type === "text") {
    return applyMarks(node.text ?? "", node.marks ?? []);
  }
  return (node.content ?? []).map(serializeInlineNode).join("");
};

export const tiptapExplanationToValue = (json: TiptapNode) =>
  (json.content ?? [])
    .map((node) => (node.content ?? []).map(serializeInlineNode).join(""))
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n");

const serializePlainInlineNode = (node: TiptapNode): string => {
  if (node.type === "hardBreak") return "\n";
  if (node.type === "text") return node.text ?? "";
  return (node.content ?? []).map(serializePlainInlineNode).join("");
};

export const tiptapDocumentToPlainText = (json: TiptapNode) =>
  (json.content ?? [])
    .map((node) => (node.content ?? []).map(serializePlainInlineNode).join(""))
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n");
