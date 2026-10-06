import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Eraser,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Square,
  Underline as UnderlineIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, type ReactNode } from "react";

export type WritingPracticeRichTextDocument = Record<string, unknown>;

const EMPTY_DOCUMENT: WritingPracticeRichTextDocument = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

type Props = {
  value?: WritingPracticeRichTextDocument | null;
  onChange: (value: WritingPracticeRichTextDocument) => void;
  label: string;
  placeholder: string;
  minHeight?: number;
  disabled?: boolean;
  allowBoxedBlock?: boolean;
};

const normalizeDocument = (
  value?: WritingPracticeRichTextDocument | null,
): JSONContent =>
  value && value.type === "doc"
    ? (value as JSONContent)
    : (EMPTY_DOCUMENT as JSONContent);

const canonicalizeJson = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalizeJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, canonicalizeJson(nestedValue)]),
    );
  }
  return value;
};

const serializeDocument = (value: JSONContent) =>
  JSON.stringify(canonicalizeJson(value));

export default function WritingPracticeRichTextEditor({
  value,
  onChange,
  label,
  placeholder,
  minHeight = 180,
  disabled = false,
  allowBoxedBlock = false,
}: Props) {
  const lastEmitted = useRef(serializeDocument(normalizeDocument(value)));
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        blockquote: allowBoxedBlock ? {} : false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        link: false,
        strike: false,
        heading: { levels: [2, 3] },
      }),
      Underline,
    ],
    [allowBoxedBlock],
  );

  const editor = useEditor({
    extensions,
    content: normalizeDocument(value),
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "aria-label": label,
        "aria-multiline": "true",
        class:
          "writing-v2-rich-editor px-4 py-3 text-[15px] leading-7 text-neutral-900 outline-none",
        role: "textbox",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const nextValue = currentEditor.getJSON() as WritingPracticeRichTextDocument;
      const serialized = serializeDocument(nextValue);
      if (serialized === lastEmitted.current) return;
      lastEmitted.current = serialized;
      onChange(nextValue);
    },
  });

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor) return;
    const nextDocument = normalizeDocument(value);
    const serialized = serializeDocument(nextDocument);
    if (serialized === lastEmitted.current) return;
    if (serialized === serializeDocument(editor.getJSON())) return;
    editor.commands.setContent(nextDocument, { emitUpdate: false });
    lastEmitted.current = serialized;
  }, [editor, value]);

  const run = (command: () => boolean) => {
    if (!editor || disabled) return;
    command();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <label className="text-sm font-semibold text-neutral-800">{label}</label>
        <div
          className="flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-1"
          aria-label={`${label} biçimlendirme araçları`}
        >
          <ToolbarButton
            label="Başlık"
            icon={<Heading2 size={15} />}
            active={editor?.isActive("heading", { level: 2 })}
            disabled={disabled}
            onClick={() =>
              run(() => editor!.chain().focus().toggleHeading({ level: 2 }).run())
            }
          />
          <ToolbarButton
            label="Kalın"
            icon={<Bold size={15} />}
            active={editor?.isActive("bold")}
            disabled={disabled}
            onClick={() => run(() => editor!.chain().focus().toggleBold().run())}
          />
          <ToolbarButton
            label="İtalik"
            icon={<Italic size={15} />}
            active={editor?.isActive("italic")}
            disabled={disabled}
            onClick={() => run(() => editor!.chain().focus().toggleItalic().run())}
          />
          <ToolbarButton
            label="Altı çizili"
            icon={<UnderlineIcon size={15} />}
            active={editor?.isActive("underline")}
            disabled={disabled}
            onClick={() => run(() => editor!.chain().focus().toggleUnderline().run())}
          />
          <ToolbarButton
            label="Madde listesi"
            icon={<List size={15} />}
            active={editor?.isActive("bulletList")}
            disabled={disabled}
            onClick={() => run(() => editor!.chain().focus().toggleBulletList().run())}
          />
          <ToolbarButton
            label="Numaralı liste"
            icon={<ListOrdered size={15} />}
            active={editor?.isActive("orderedList")}
            disabled={disabled}
            onClick={() => run(() => editor!.chain().focus().toggleOrderedList().run())}
          />
          {allowBoxedBlock ? (
            <ToolbarButton
              label="Dikdörtgen içine al"
              icon={<Square size={15} />}
              active={editor?.isActive("blockquote")}
              disabled={disabled}
              onClick={() => run(() => editor!.chain().focus().toggleBlockquote().run())}
            />
          ) : null}
          <span className="mx-0.5 h-4 w-px bg-neutral-200" />
          <ToolbarButton
            label="Biçimi temizle"
            icon={<Eraser size={15} />}
            disabled={disabled}
            onClick={() =>
              run(() => editor!.chain().focus().clearNodes().unsetAllMarks().run())
            }
          />
        </div>
      </div>

      <div
        className={`relative overflow-hidden rounded-md border bg-white transition ${
          disabled
            ? "border-neutral-200 bg-neutral-50"
            : "border-neutral-200 focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-100"
        }`}
        style={{ minHeight }}
      >
        {editor?.isEmpty ? (
          <p className="pointer-events-none absolute left-4 top-3 whitespace-pre-line text-[15px] leading-7 text-neutral-400">
            {placeholder}
          </p>
        ) : null}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  icon,
  onClick,
  active,
  disabled,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={Boolean(active)}
      title={label}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`inline-flex h-7 w-7 items-center justify-center rounded text-neutral-600 transition hover:bg-white hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "bg-white text-neutral-950 shadow-sm" : ""
      }`}
    >
      {icon}
    </button>
  );
}
