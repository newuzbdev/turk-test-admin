import { useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { Button, Divider, Space, Tooltip, message } from "antd";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Braces,
  Code,
  Heading1,
  Heading2,
  Highlighter,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  Table2,
  Underline as UnderlineIcon,
} from "lucide-react";
import {
  isSafeRichEditorUrl,
  markdownLikeToTiptapHtml,
  tiptapJsonToMarkdownLike,
} from "./rich-block-markdown";

type RichBlockEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
};

export default function RichBlockEditor({
  value,
  onChange,
  disabled,
}: RichBlockEditorProps) {
  const lastEmittedValue = useRef(value ?? "");
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        codeBlock: false,
        horizontalRule: false,
        link: false,
        underline: false,
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Link.configure({
        autolink: true,
        linkOnPaste: true,
        openOnClick: false,
        HTMLAttributes: {
          rel: "noreferrer noopener",
          target: "_blank",
        },
      }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    [],
  );

  const editor = useEditor({
    extensions,
    content: markdownLikeToTiptapHtml(value),
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-60 rounded-md border border-gray-200 bg-white px-4 py-3 text-sm leading-7 outline-none transition focus:border-gray-400",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const nextValue = tiptapJsonToMarkdownLike(currentEditor.getJSON());
      lastEmittedValue.current = nextValue;
      onChange?.(nextValue);
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor) return;
    const incomingValue = value ?? "";
    if (incomingValue === lastEmittedValue.current) return;

    const currentValue = tiptapJsonToMarkdownLike(editor.getJSON());
    if (incomingValue === currentValue) return;

    editor.commands.setContent(markdownLikeToTiptapHtml(incomingValue), {
      emitUpdate: false,
    });
    lastEmittedValue.current = incomingValue;
  }, [editor, value]);

  const run = (command: () => boolean) => {
    if (!editor || disabled) return;
    command();
  };

  const setLink = () => {
    if (!editor || disabled) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const nextUrl = window.prompt("Bağlantı URL'si", previousUrl ?? "");
    if (nextUrl === null) return;
    const trimmed = nextUrl.trim();

    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    if (!isSafeRichEditorUrl(trimmed)) {
      message.warning("Güvenli bir bağlantı girin.");
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
  };

  const insertBlank = () => {
    if (!editor || disabled) return;
    const placeholder = window.prompt(
      "Boşluk ipucu",
      "",
    );
    if (placeholder === null) return;
    const trimmed = placeholder.trim();
    const token = trimmed ? `{{blank:${trimmed}}}` : "{{blank}}";
    editor.chain().focus().insertContent(token).run();
  };

  const insertTable = () => {
    run(() =>
      editor!
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
    );
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-3">
      <Space size={4} wrap className="mb-3">
        <ToolbarButton
          label="Başlık 1"
          active={editor?.isActive("heading", { level: 1 })}
          disabled={disabled}
          icon={<Heading1 size={15} />}
          onClick={() =>
            run(() => editor!.chain().focus().toggleHeading({ level: 1 }).run())
          }
        />
        <ToolbarButton
          label="Başlık 2"
          active={editor?.isActive("heading", { level: 2 })}
          disabled={disabled}
          icon={<Heading2 size={15} />}
          onClick={() =>
            run(() => editor!.chain().focus().toggleHeading({ level: 2 }).run())
          }
        />
        <Divider type="vertical" />
        <ToolbarButton
          label="Kalın"
          active={editor?.isActive("bold")}
          disabled={disabled}
          icon={<Bold size={15} />}
          onClick={() => run(() => editor!.chain().focus().toggleBold().run())}
        />
        <ToolbarButton
          label="İtalik"
          active={editor?.isActive("italic")}
          disabled={disabled}
          icon={<Italic size={15} />}
          onClick={() => run(() => editor!.chain().focus().toggleItalic().run())}
        />
        <ToolbarButton
          label="Altı çizili"
          active={editor?.isActive("underline")}
          disabled={disabled}
          icon={<UnderlineIcon size={15} />}
          onClick={() => run(() => editor!.chain().focus().toggleUnderline().run())}
        />
        <ToolbarButton
          label="Üstü çizili"
          active={editor?.isActive("strike")}
          disabled={disabled}
          icon={<Strikethrough size={15} />}
          onClick={() => run(() => editor!.chain().focus().toggleStrike().run())}
        />
        <ToolbarButton
          label="Vurgula"
          active={editor?.isActive("highlight")}
          disabled={disabled}
          icon={<Highlighter size={15} />}
          onClick={() => run(() => editor!.chain().focus().toggleHighlight().run())}
        />
        <ToolbarButton
          label="Kod"
          active={editor?.isActive("code")}
          disabled={disabled}
          icon={<Code size={15} />}
          onClick={() => run(() => editor!.chain().focus().toggleCode().run())}
        />
        <Divider type="vertical" />
        <ToolbarButton
          label="Madde listesi"
          active={editor?.isActive("bulletList")}
          disabled={disabled}
          icon={<List size={15} />}
          onClick={() => run(() => editor!.chain().focus().toggleBulletList().run())}
        />
        <ToolbarButton
          label="Numaralı liste"
          active={editor?.isActive("orderedList")}
          disabled={disabled}
          icon={<ListOrdered size={15} />}
          onClick={() => run(() => editor!.chain().focus().toggleOrderedList().run())}
        />
        <ToolbarButton
          label="Alıntı"
          active={editor?.isActive("blockquote")}
          disabled={disabled}
          icon={<Quote size={15} />}
          onClick={() => run(() => editor!.chain().focus().toggleBlockquote().run())}
        />
        <ToolbarButton
          label="Bağlantı"
          active={editor?.isActive("link")}
          disabled={disabled}
          icon={<LinkIcon size={15} />}
          onClick={setLink}
        />
        <ToolbarButton
          label="Tablo"
          disabled={disabled}
          icon={<Table2 size={15} />}
          onClick={insertTable}
        />
        <ToolbarButton
          label="Boşluk ekle"
          disabled={disabled}
          icon={<Braces size={15} />}
          onClick={insertBlank}
        />
      </Space>

      <EditorContent editor={editor} />

      <details className="mt-3 rounded-md bg-white px-3 py-2 text-xs text-gray-500">
        <summary className="cursor-pointer select-none font-medium text-gray-600">
          Markdown çıktısını göster
        </summary>
        <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-2 font-mono text-[11px] leading-5">
          {value ?? ""}
        </pre>
      </details>
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
    <Tooltip title={label}>
      <Button
        aria-label={label}
        htmlType="button"
        size="small"
        type={active ? "primary" : "default"}
        icon={icon}
        disabled={disabled}
        onClick={onClick}
      />
    </Tooltip>
  );
}
