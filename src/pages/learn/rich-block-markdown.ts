type TiptapMark = {
  type?: string;
  attrs?: Record<string, unknown> | null;
};

type TiptapNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown> | null;
  marks?: TiptapMark[];
  content?: TiptapNode[];
};

type RichBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "blockquote"; text: string }
  | { type: "unordered-list"; items: string[] }
  | { type: "ordered-list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

type InlineToken =
  | { type: "text"; value: string }
  | { type: "code"; value: string }
  | { type: "link"; label: string; href: string; safe: boolean }
  | { type: "strong" | "em" | "strike" | "mark" | "underline"; value: string };

type InlinePattern = {
  regex: RegExp;
  build: (match: RegExpExecArray) => InlineToken;
};

type InlineMatch = {
  index: number;
  raw: string;
  token: InlineToken;
  priority: number;
};

const INLINE_PATTERNS: InlinePattern[] = [
  {
    regex: /`([^`\n]+)`/g,
    build: (match) => ({ type: "code", value: match[1] ?? "" }),
  },
  {
    regex: /\[([^\]\n]+)\]\(([^)\s]+)\)/g,
    build: (match) => {
      const href = match[2]?.trim() ?? "";
      return {
        type: "link",
        label: match[1] ?? "",
        href,
        safe: isSafeRichEditorUrl(href),
      };
    },
  },
  {
    regex: /\*\*([^*\n]+)\*\*/g,
    build: (match) => ({ type: "strong", value: match[1] ?? "" }),
  },
  {
    regex: /==([^=\n]+)==/g,
    build: (match) => ({ type: "mark", value: match[1] ?? "" }),
  },
  {
    regex: /~~([^~\n]+)~~/g,
    build: (match) => ({ type: "strike", value: match[1] ?? "" }),
  },
  {
    regex: /\+\+([^+\n]+)\+\+/g,
    build: (match) => ({ type: "underline", value: match[1] ?? "" }),
  },
  {
    regex: /\*([^*\n]+)\*/g,
    build: (match) => ({ type: "em", value: match[1] ?? "" }),
  },
];

export function markdownLikeToTiptapHtml(text?: string | null) {
  if (!text?.trim()) {
    return "<p></p>";
  }

  return parseMarkdownLikeBlocks(text)
    .map((block) => {
      if (block.type === "heading") {
        const level = Math.min(block.level, 3);
        return `<h${level}>${renderInlineMarkdownToHtml(block.text)}</h${level}>`;
      }

      if (block.type === "blockquote") {
        return `<blockquote><p>${renderInlineMarkdownToHtml(block.text)}</p></blockquote>`;
      }

      if (block.type === "unordered-list") {
        return `<ul>${block.items
          .map((item) => `<li><p>${renderInlineMarkdownToHtml(item)}</p></li>`)
          .join("")}</ul>`;
      }

      if (block.type === "ordered-list") {
        return `<ol>${block.items
          .map((item) => `<li><p>${renderInlineMarkdownToHtml(item)}</p></li>`)
          .join("")}</ol>`;
      }

      if (block.type === "table") {
        const headerRow = `<tr>${block.headers
          .map((cell) => `<th><p>${renderInlineMarkdownToHtml(cell)}</p></th>`)
          .join("")}</tr>`;
        const bodyRows = block.rows
          .map(
            (row) =>
              `<tr>${block.headers
                .map((_, index) => `<td><p>${renderInlineMarkdownToHtml(row[index] ?? "")}</p></td>`)
                .join("")}</tr>`,
          )
          .join("");

        return `<table><tbody>${headerRow}${bodyRows}</tbody></table>`;
      }

      return `<p>${renderInlineMarkdownToHtml(block.text)}</p>`;
    })
    .join("");
}

export function tiptapJsonToMarkdownLike(json: TiptapNode) {
  return normalizeMarkdownOutput(serializeBlockNodes(json.content ?? []));
}

export function isSafeRichEditorUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("#") || trimmed.startsWith("/")) return true;

  try {
    const url = new URL(trimmed, "https://turkishmock.local");
    return ["http:", "https:", "mailto:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function parseMarkdownLikeBlocks(text: string): RichBlock[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const blocks: RichBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 1 | 2 | 3,
        text: headingMatch[2].trim(),
      });
      index += 1;
      continue;
    }

    if (isTableStart(lines, index)) {
      const table = parseTable(lines, index);
      blocks.push(table.block);
      index = table.nextIndex;
      continue;
    }

    if (/^\s*>\s+/.test(line)) {
      const collected: string[] = [];
      while (index < lines.length && /^\s*>\s?/.test(lines[index] ?? "")) {
        collected.push((lines[index] ?? "").replace(/^\s*>\s?/, "").trim());
        index += 1;
      }
      blocks.push({ type: "blockquote", text: collected.join(" ") });
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index] ?? "")) {
        items.push((lines[index] ?? "").replace(/^\s*[-*]\s+/, "").trim());
        index += 1;
      }
      blocks.push({ type: "unordered-list", items });
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*\d+[.)]\s+/.test(lines[index] ?? "")) {
        items.push((lines[index] ?? "").replace(/^\s*\d+[.)]\s+/, "").trim());
        index += 1;
      }
      blocks.push({ type: "ordered-list", items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      index < lines.length &&
      lines[index]?.trim() &&
      !isBlockStart(lines, index)
    ) {
      paragraphLines.push(lines[index]?.trim() ?? "");
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
  }

  return blocks.filter((block) => {
    if (block.type === "table") return block.headers.length > 0;
    if ("items" in block) return block.items.length > 0;
    return block.text.trim().length > 0;
  });
}

function renderInlineMarkdownToHtml(text: string): string {
  return parseInlineTokens(text)
    .map((token) => {
      if (token.type === "text") return escapeHtml(token.value);
      if (token.type === "code") return `<code>${escapeHtml(token.value)}</code>`;
      if (token.type === "link") {
        if (!token.safe) return escapeHtml(token.label);
        return `<a href="${escapeAttribute(token.href)}">${renderInlineMarkdownToHtml(token.label)}</a>`;
      }
      if (token.type === "strong") return `<strong>${renderInlineMarkdownToHtml(token.value)}</strong>`;
      if (token.type === "em") return `<em>${renderInlineMarkdownToHtml(token.value)}</em>`;
      if (token.type === "strike") return `<s>${renderInlineMarkdownToHtml(token.value)}</s>`;
      if (token.type === "mark") return `<mark>${renderInlineMarkdownToHtml(token.value)}</mark>`;
      if (token.type === "underline") return `<u>${renderInlineMarkdownToHtml(token.value)}</u>`;
      return "";
    })
    .join("");
}

function parseInlineTokens(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const next = findNextInlineToken(text, cursor);

    if (!next) {
      tokens.push({ type: "text", value: text.slice(cursor) });
      break;
    }

    if (next.index > cursor) {
      tokens.push({ type: "text", value: text.slice(cursor, next.index) });
    }

    tokens.push(next.token);
    cursor = next.index + next.raw.length;
  }

  return tokens.filter((token) => token.type !== "text" || token.value.length > 0);
}

function findNextInlineToken(text: string, cursor: number): InlineMatch | null {
  let bestMatch: InlineMatch | null = null;

  INLINE_PATTERNS.forEach((pattern, priority) => {
    pattern.regex.lastIndex = cursor;
    const match = pattern.regex.exec(text);
    if (!match?.[0]) return;
    if (
      !bestMatch ||
      match.index < bestMatch.index ||
      (match.index === bestMatch.index && priority < bestMatch.priority)
    ) {
      bestMatch = {
        index: match.index,
        raw: match[0],
        token: pattern.build(match),
        priority,
      };
    }
  });

  return bestMatch;
}

function serializeBlockNodes(nodes: TiptapNode[]) {
  return nodes
    .map((node, index) => serializeBlockNode(node, index))
    .filter(Boolean)
    .join("\n\n");
}

function serializeBlockNode(node: TiptapNode, index = 0): string {
  switch (node.type) {
    case "heading": {
      const level = getHeadingLevel(node.attrs?.level);
      return `${"#".repeat(level)} ${serializeInlineNodes(node.content ?? [])}`.trim();
    }
    case "paragraph":
      return serializeInlineNodes(node.content ?? []);
    case "blockquote":
      return serializeBlockNodes(node.content ?? [])
        .split("\n")
        .map((line) => `> ${line}`.trimEnd())
        .join("\n");
    case "bulletList":
      return (node.content ?? [])
        .map((item) => `- ${serializeListItem(item)}`.trimEnd())
        .join("\n");
    case "orderedList": {
      const start = typeof node.attrs?.start === "number" ? node.attrs.start : 1;
      return (node.content ?? [])
        .map((item, itemIndex) => `${start + itemIndex}. ${serializeListItem(item)}`.trimEnd())
        .join("\n");
    }
    case "table":
      return serializeTable(node);
    case "codeBlock":
      return `\`\`\`\n${serializePlainText(node.content ?? [])}\n\`\`\``;
    case "horizontalRule":
      return index === 0 ? "---" : "\n---";
    default:
      return serializeInlineNodes(node.content ?? []);
  }
}

function serializeInlineNodes(nodes: TiptapNode[]): string {
  return nodes.map(serializeInlineNode).join("");
}

function serializeInlineNode(node: TiptapNode): string {
  if (node.type === "hardBreak") return "\n";
  if (node.type !== "text") return serializeInlineNodes(node.content ?? []);

  return applyMarks(node.text ?? "", node.marks ?? []);
}

function serializePlainText(nodes: TiptapNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text") return node.text ?? "";
      if (node.type === "hardBreak") return "\n";
      return serializePlainText(node.content ?? []);
    })
    .join("");
}

function serializeListItem(node: TiptapNode): string {
  const content = node.content ?? [];
  return content
    .map((child) => serializeBlockNode(child))
    .join("\n  ")
    .replace(/\n{3,}/g, "\n\n");
}

function serializeTable(node: TiptapNode): string {
  const rows = (node.content ?? []).map((row) =>
    (row.content ?? []).map((cell) => normalizeTableCell(serializeBlockNodes(cell.content ?? []))),
  );

  if (rows.length === 0) return "";

  const headers = rows[0];
  const bodyRows = rows.slice(1);
  const divider = headers.map(() => "---");
  return [headers, divider, ...bodyRows]
    .map((row) => `| ${row.join(" | ")} |`)
    .join("\n");
}

function normalizeTableCell(value: string) {
  return value.replace(/\n+/g, " ").replace(/\|/g, "\\|").trim();
}

function applyMarks(text: string, marks: TiptapMark[]) {
  return marks.reduce((value, mark) => {
    if (mark.type === "code") return `\`${value}\``;
    if (mark.type === "bold") return `**${value}**`;
    if (mark.type === "italic") return `*${value}*`;
    if (mark.type === "strike") return `~~${value}~~`;
    if (mark.type === "underline") return `++${value}++`;
    if (mark.type === "highlight") return `==${value}==`;
    if (mark.type === "link") {
      const href = typeof mark.attrs?.href === "string" ? mark.attrs.href.trim() : "";
      return isSafeRichEditorUrl(href) ? `[${value}](${href})` : value;
    }
    return value;
  }, text);
}

function getHeadingLevel(value: unknown): 1 | 2 | 3 {
  if (value === 1 || value === 2 || value === 3) return value;
  return 2;
}

function normalizeMarkdownOutput(value: string) {
  return value
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isBlockStart(lines: string[], index: number) {
  const line = lines[index] ?? "";
  return (
    /^(#{1,3})\s+/.test(line) ||
    /^\s*>\s+/.test(line) ||
    /^\s*[-*]\s+/.test(line) ||
    /^\s*\d+[.)]\s+/.test(line) ||
    isTableStart(lines, index)
  );
}

function isTableStart(lines: string[], index: number) {
  const header = lines[index] ?? "";
  const divider = lines[index + 1] ?? "";
  return header.includes("|") && isTableDivider(divider);
}

function isTableDivider(line: string) {
  const cells = splitTableRow(line);
  return (
    cells.length > 0 &&
    cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, "")))
  );
}

function parseTable(lines: string[], index: number) {
  const headers = splitTableRow(lines[index] ?? "");
  const rows: string[][] = [];
  let nextIndex = index + 2;

  while (nextIndex < lines.length && (lines[nextIndex] ?? "").includes("|")) {
    const row = splitTableRow(lines[nextIndex] ?? "");
    if (row.length === 0) break;
    rows.push(row);
    nextIndex += 1;
  }

  return {
    block: { type: "table" as const, headers, rows },
    nextIndex,
  };
}

function splitTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}
